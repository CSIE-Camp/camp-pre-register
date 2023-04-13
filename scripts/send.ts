import fs from "node:fs";
import { program } from "commander";
import { parse } from "csv-parse/sync";
import { config } from "dotenv";
import inquirer from "inquirer";

config();

const TOKEN = process.env.HERMES_MAIL_TOKEN;
if (!TOKEN) {
	throw new Error("HERMES_MAIL_TOKEN is not set");
}

program
	.argument("<mail>", "HTML mail file to use")
	.option("-t, --to <emails...>", "Emails to send to")
	.option("-l, --list <file>", "Emails list to send to")
	.option("-s, --subject <subject>", "Subject of the email")
	.action(async (mail: string, options: { to?: string[]; list?: string; subject?: string }) => {
		const html = fs.readFileSync(mail, "utf-8");
		const emails = options.to ?? [];
		const subject = options.subject ?? "";

		if (options.list) {
			const list = fs.readFileSync(options.list, "utf-8");
			const records: [{ email: string; date: string }] = parse(list, {
				columns: true,
				skip_empty_lines: true,
			});
			emails.push(...records.map((r) => r.email));
		}

		if (!emails?.length || !subject) {
			console.error("Missing arguments");
			process.exit(1);
		}

		if (options.list && options.list.toLowerCase().includes("dev")) {
			options.subject = "[測試] " + options.subject;
		}

		console.log("Emails:", emails.join(", "));

		const { confirm } = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirm",
				message: `Send mail "${subject}" to ${emails.length} emails?`,
			},
		]);

		if (!confirm) {
			console.log("Canceled");
			return;
		}

		for (let i = 0; i < emails.length; i += 100) {
			const targets = emails.slice(i, i + 100);
			await send(targets, subject, html);
			console.log(
				`Sent emails to ${targets.join(", ")} (${i + targets.length} / ${emails.length})`,
			);
		}

		console.log("Done");
	});

program.parse();

async function send(to: string[], subject: string, content: string): Promise<void> {
	const res = await fetch("https://hermes.csie.cool/api/send", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: {
				email: "camp@csie.cool",
				name: "師大資工營",
			},
			to,
			subject,
			content,
		}),
	});

	if (!res.ok) {
		throw new Error(`Failed to send email: ${res.status} ${await res.text()}`);
	}
}
