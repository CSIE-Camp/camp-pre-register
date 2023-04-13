# 資工營 事前登錄

師大資工營的事前登錄系統。

## 事前登錄

你可以前往 <https://camp.csie.cool/> 進行事前登錄。

## 使用 SendKit

先建立一個 `.env` 檔案，內容如下：

```ts
HERMES_MAIL_TOKEN="<your token>"
```

然後執行

```bash
pnpm send static/email/1-discord-bot.html -s '信件標題' -l maillists/dev.csv
```

這將會把 `static/email/1-discord-bot.html` 的內容，以 `信件標題` 的標題，寄給 `maillists/dev.csv` 中的所有人。

> `pnpm send --help` 查看更多用法。
