import { IsArray, IsEmail, IsString } from "class-validator";
import { WorkLogsDTO } from "./worklogs.dto";

export class CreateMailDto {
 @IsString()
 @IsEmail()
 destinatario: string;

 @IsArray()
 editedWorkLogs: WorkLogsDTO[];
}
