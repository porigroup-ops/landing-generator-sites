const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, error: "Method not allowed" }),
      };
    }

    const body = JSON.parse(event.body || "{}");

    const name = String(body.name || "").trim();
    const senderEmail = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const businessNameFromForm = String(body.business_name || "").trim();
    const rid = String(body.rid || "").trim();

    if (!name || !senderEmail || !message || !rid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Missing required fields" }),
      };
    }

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}/${rid}`;

    const airtableRes = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
    });

    const record = await airtableRes.json();
    const fields = record.fields || {};

    const contactEmail = fields.contact_email || fields.email;

    if (!contactEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "No email found" }),
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: contactEmail,
      replyTo: senderEmail,
      subject: `Uusi yhteydenotto – ${businessNameFromForm}`,
      text: `
Nimi: ${name}
Sähköposti: ${senderEmail}

Viesti:
${message}
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
