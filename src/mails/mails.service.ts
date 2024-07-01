import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import axios from 'axios';
import { CreateMailDto } from './dto/create-mail.dto';
import * as Excel from 'exceljs';
import { InjectRepository } from '@nestjs/typeorm';
import { Mail } from './entities/mail.entity';
import { Repository } from 'typeorm';
import { WorLogsResponseDTO } from './response-dto/worklogs-response-dto';
import { WorkLogsDTO } from './dto/worklogs.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';


@Injectable()
export class MailsService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private mailerService: MailerService,
    @InjectRepository(Mail)
    private readonly mailRepository: Repository<Mail>,
  ) {
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async deleteTableData() {
    await this.mailRepository.clear()
  }


  async sendAttachmentAndEmail(mailDto: CreateMailDto) {
    try {
      const from = this.getPreviousMondayAndFridayAux().previousMonday;
      const to = this.getPreviousMondayAndFridayAux().previousFriday;
      const filename = `TareasSemana.xlsx`;
      const currentHour = new Date().getHours();
      let greeting: string;

      if (currentHour >= 18 || currentHour < 5) {
        greeting = 'Buenas noches';
      } else if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Buenos días';
      } else {
        greeting = 'Buenas tardes';
      }

      const mailOptions = {
        from: 'sebastian.leal@sermaluc.cl',
        to: mailDto.destinatario,
        subject: `Tareas Semana Del: ${from} Al: ${to}`,
        text: `${greeting} Alejandra junto con saludar, adjunto tareas semana mencionada. Saludos cordiales.`,
        attachments: [
          {
            filename,
            content: await this.generateExcel(filename, mailDto?.editedWorkLogs),
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      };
      return await this.mailerService.sendMail(mailOptions);
    } catch (err) {
      return err;
    }
  }

  async generateExcel(filename: string, editedWorkLogs: WorkLogsDTO[]): Promise<Buffer> {
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet(filename);

    worksheet.columns = [
      { header: 'Descripcion', key: 'descripcion' },
      { header: 'Fecha Inicio', key: 'fechaInicio' },
      { header: 'Fecha Vencimiento', key: 'fechaVencimiento' },
      { header: '% Completado', key: 'porcentajeCompletado' },
      { header: 'Notas', key: 'notas' },
    ];

    // Establecer el color de fondo de los encabezados
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFADD8E6' }, // Color azul claro
      };
      cell.font = {
        bold: true,
      };
      // Agregar bordes a los encabezados
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    editedWorkLogs.forEach(element => {
      const row = worksheet.addRow(element);
      // Agregar bordes a todas las celdas del row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  async processWorkLog() {
    const lastIndexMap = new Map();
    const workLogs = await this.getWorkLogs();
    const workLogsArr = workLogs.data.results as Array<any>;
    const allElements: WorLogsResponseDTO[] = [];

    // Crear el Map con el último índice de cada issueId
    workLogsArr.forEach((worklog, index) => {
      const issueId = worklog.issue.id;
      lastIndexMap.set(issueId, index);
    });

    // Obtener los worklogs únicos basados en el último índice
    lastIndexMap.forEach((index, issueId) => {
      const ocurrence = workLogsArr[index];
      const match = workLogsArr.find(workLog => workLog.issue.id === issueId);
      allElements.push({
        idIssue: match.issue.id,
        descripcion: match.description,
        fechaInicio: match.startDate,
        fechaVencimiento: ocurrence.issue.id === match.issue.id ? ocurrence.startDate : match.startDate,
        porcentajeCompletado: '100%',
        notas: 'Tarea finalizada'
      });
    });

    return await this.mailRepository.save(allElements);
    //   return allElements; // WORKLOGS QUE RETORNA AXIOS
  }


  async getWorkLogs() {
    const userId = '712020%3A4723b853-e98f-49be-a1bd-eb9e9f6cf875';
    const from = this.getPreviousMondayAndFriday().previousMonday;
    const to = this.getPreviousMondayAndFriday().previousFriday;

    return axios({
      method: 'GET',
      url: `https://api.tempo.io/4/worklogs/user/${userId}?from=${from}&to=${to}`,
      headers: {
        Authorization: 'Bearer NlXQBWTVdkvGDCARZHvgHkKTy4Q0Pv-us',
      },
    });
  }

  getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getPreviousMondayAndFriday(): { previousMonday: string, previousFriday: string } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Calculate the difference in days from today to the previous Monday
    const diffToPreviousMonday = dayOfWeek === 0 ? -6 - 7 : 1 - dayOfWeek - 7;
    const diffToPreviousFriday = diffToPreviousMonday + 4; // 4 days after Monday is Friday

    const previousMonday = new Date(today);
    previousMonday.setDate(today.getDate() + diffToPreviousMonday);

    const previousFriday = new Date(today);
    previousFriday.setDate(today.getDate() + diffToPreviousFriday);

    return {
      previousMonday: this.getFormattedDate(previousMonday),
      previousFriday: this.getFormattedDate(previousFriday),
    };
  }

  getFormattedDateAux(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  getPreviousMondayAndFridayAux(): { previousMonday: string, previousFriday: string } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Calculate the difference in days from today to the previous Monday
    const diffToPreviousMonday = dayOfWeek === 0 ? -6 - 7 : 1 - dayOfWeek - 7;
    const diffToPreviousFriday = diffToPreviousMonday + 4; // 4 days after Monday is Friday

    const previousMonday = new Date(today);
    previousMonday.setDate(today.getDate() + diffToPreviousMonday);

    const previousFriday = new Date(today);
    previousFriday.setDate(today.getDate() + diffToPreviousFriday);

    return {
      previousMonday: this.getFormattedDateAux(previousMonday),
      previousFriday: this.getFormattedDateAux(previousFriday),
    };
  }

}
