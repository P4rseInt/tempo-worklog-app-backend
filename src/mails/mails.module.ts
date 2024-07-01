import { Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { MailsController } from './mails.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mail } from './entities/mail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mail]),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        auth: {
          user: 'sebastian.leal@sermaluc.cl',
          pass: 'vghz tncj bxoo phcj',
        },
      },
    }),
  ],
  controllers: [MailsController],
  providers: [MailsService],
})
export class MailsModule {
}
