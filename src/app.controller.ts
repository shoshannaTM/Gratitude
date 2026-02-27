import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Render,
  Res,
  Sse,
} from '@nestjs/common';
import { Subject } from 'rxjs';
import { AppService } from './app.service';
import { GratitudeService } from './gratitude/gratitude.service';
import { type Response } from 'express';

@Controller()
export class AppController {
  private logger = new Logger(AppController.name);

  private message$ = new Subject<string>();

  constructor(
    private readonly appService: AppService,
    private readonly gratitudeService: GratitudeService,
  ) {}

  @Get()
  @Render('index')
  async getHello(@Res({ passthrough: true }) res: Response): Promise<any> {
    const user = (res as any).locals?.user;
    let todayEntry: Record<string, any> | null = null;
    let inputSlots: number[] = [];
    const today = new Date().toISOString().split('T')[0];
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (user) {
      todayEntry = await this.gratitudeService.getTodaysEntry(user.id);
      if (!todayEntry) {
        const count = user.promptCount ?? 3;
        inputSlots = Array.from({ length: count }, (_, i) => i + 1);
      }
    }

    return { todayEntry, inputSlots, today, todayFormatted };
  }

  @Get('chat')
  @Render('chat')
  getChat(): any {
    return {
      message: this.appService.getHello(),
    };
  }

  @Get('offline.html')
  @Render('offline')
  getOffline() {}

  @Sse('sse')
  getChatStream() {
    return this.message$;
  }

  @Post('message')
  async postMessages(@Body() body: any) {
    const message = body.message as string;
    this.message$.next(`
      <div class='chat chat-end'>
        <div class='chat-header'>
          User
        </div>
        <div class='chat-bubble'>${message}</div>
      </div>
      `);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.message$.next(`
      <div class='chat chat-start'>
        <div class='chat-header'>
          Assistant
        </div>
        <div class='chat-bubble'>1</div>
      </div>
      `);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.message$.next(`
      <div class='chat chat-start'>
        <div class='chat-header'>
          Assistant
        </div>
        <div class='chat-bubble'>2</div>
      </div>
      `);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.message$.next(`
      <div class='chat chat-start'>
        <div class='chat-header'>
          Assistant
        </div>
        <div class='chat-bubble'>3</div>
      </div>
      `);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.message$.next(`
      <div class='chat chat-start'>
        <div class='chat-header'>
          Assistant
        </div>
        <div class='chat-bubble'>Hello World</div>
      </div>
      `);
    this.logger.debug(`done with ${this.postMessages.name}`);
  }

  @Get('.well-known/*path')
  well_known() {
    return {}; // Just return empty object
  }
}
