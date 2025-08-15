
import nodemailer from "nodemailer";

// función refactorizada por inteligencia artificial 
export const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "villamendozaerick@gmail.com",
        pass: "efgx mjws qukp wkdw", // NO la normal
      },
    });

    const info = await transporter.sendMail({
      from: '"Sistema de Tutorías" <villamendozaerick@gmail.com>',
      to, // destinatario dinámico
      subject,
      text,
    });

    console.log("Correo enviado:", info.messageId);
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
};
