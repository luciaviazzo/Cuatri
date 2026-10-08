import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Infraestructura')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
