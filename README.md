# Nova AI Studio

Готовый Node.js + Express проект для веб-интерфейса генерации изображений и видео через getimg.ai.

## Запуск

```bash
npm install
npm start
```

Затем открой `http://localhost:3000`.

## Render

- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable: `GETIMG_API_KEY`

## Безопасность

API-ключ хранится на сервере и не должен находиться в `public/index.html` или публичном GitHub-репозитории.

## Ограничения

Nova AI Studio не добавляет искусственный счётчик генераций. Фактические ограничения, стоимость и rate limits определяются API-провайдером.
