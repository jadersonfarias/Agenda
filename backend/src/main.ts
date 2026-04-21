import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  app.enableCors({ origin: true })
  const host = process.env.HOST || '0.0.0.0'
  console.log('Backend starting listen on 3333...')
  try {
    await app.listen(3333, host)
    console.log('Backend rodando em http://localhost:3333')
  } catch (error) {
    console.error('Backend listen error:', error)
    process.exit(1)
  }
}

bootstrap()
