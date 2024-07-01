import { Controller, Get, Post, Body } from '@nestjs/common';
import { MailsService } from './mails.service';
import { CreateMailDto } from './dto/create-mail.dto';

@Controller('mails')
export class MailsController {
  constructor(private readonly mailsService: MailsService) { }

  @Post('send-worklog')
  async sendAttachmentAndEmail(@Body() mailDto: CreateMailDto) {
    return await this.mailsService.sendAttachmentAndEmail(mailDto);
  }

  @Get('get-worklog')
  async getWorkLog() {
    return await this.mailsService.processWorkLog()
  }
}
