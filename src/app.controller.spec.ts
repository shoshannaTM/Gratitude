import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { GratitudeService } from './gratitude/gratitude.service';

const mockGratitudeService = { getTodaysEntry: jest.fn().mockResolvedValue(null) };
const mockRes = { locals: {} } as any;

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        ConfigService,
        { provide: GratitudeService, useValue: mockGratitudeService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return today date fields', async () => {
      const result = await appController.getHello(mockRes);
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('todayFormatted');
    });
  });
});
