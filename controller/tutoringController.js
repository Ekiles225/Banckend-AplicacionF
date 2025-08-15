import { tutoringModel } from "../model/tutoringModel.js";
import { userModel } from "../model/userModel.js";
import { typeUserModel } from "../model/typeUserModel.js";
import { Op } from "sequelize";
import { sendEmail } from "../services/emailService.js";
// Constantes para IDs de roles, ajustar si alguno de estos datos cambian en la DB
//como yo tenia datos y elimine en el typeUser tengo como estudiante 3 y profesor 2
//tu si no haces pruebas es posible que tengas 1 y 2 asi que modifica aqui segun corresponda a tu DB
const STUDENT_ROLE_ID = 3;
const TEACHER_ROLE_ID = 2;

// Crear tutoría con validación de roles
// función refactorizada por inteligencia artificial 
export const createTutoring = async (req, res) => {
  try {
    const { student_id, teacher_id, topic, description, date } = req.body;

    // Verificar estudiante
    const student = await userModel.findOne({
      where: { id: student_id },
      include: [{ model: typeUserModel, attributes: ["id", "type"] }],
    });
    if (!student || student.typeuser.id !== STUDENT_ROLE_ID) {
      return res.status(400).json({
        msg: "Usuario estudiante inválido o no tiene rol estudiante.",
      });
    }

    // Verificar profesor
    const teacher = await userModel.findOne({
      where: { id: teacher_id },
      include: [{ model: typeUserModel, attributes: ["id", "type"] }],
    });
    if (!teacher || teacher.typeuser.id !== TEACHER_ROLE_ID) {
      return res.status(400).json({
        msg: "Usuario profesor inválido o no tiene rol profesor.",
      });
    }

    // Crear la tutoría
    const tutoring = await tutoringModel.create({
      student_id,
      teacher_id,
      topic,
      description,
      date,
      status: "pendiente",
    });

    // Enviar correo al estudiante
    await sendEmail({
      to: student.email, // Usa el correo real del estudiante
      subject: "Nueva tutoría asignada",
      text: `Hola ${student.user}, tu tutoría ha sido creada para el día ${date}.`,
    });

    // Responder UNA sola vez
    return res.status(201).json({
      message: "Tutoría creada y notificación enviada",
      tutoring,
    });

  } catch (error) {
    console.error("Error creando tutoría:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Listar tutorías con datos completos de estudiante y profesor
export const getTutorings = async (req, res) => {
  try {
    const tutorias = await tutoringModel.findAll({
      include: [
        {
          model: userModel,
          as: "estudiante",
          include: [{ model: typeUserModel, attributes: ["type"] }],
          attributes: ["id", "user", "email"],
        },
        {
          model: userModel,
          as: "profesor",
          include: [{ model: typeUserModel, attributes: ["type"] }],
          attributes: ["id", "user", "email"],
        },
      ],
    });

    res.json(tutorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar tutoría (p.ej. cambiar estado)
// función refactorizada por inteligencia artificial 
export const updateTutoring = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await tutoringModel.update(req.body, { where: { id } });
    if (updated) {
      const updatedTutoring = await tutoringModel.findByPk(id);
      return res.json({ message: "Tutoría actualizada", tutoring: updatedTutoring });
    }
    res.status(404).json({ message: "Tutoría no encontrada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar tutoría
export const deleteTutoring = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await tutoringModel.destroy({ where: { id } });
    if (deleted) {
      return res.json({ message: "Tutoría eliminada" });
    }
    res.status(404).json({ message: "Tutoría no encontrada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte semanal filtrado por estudiante
// función refactorizada por inteligencia artificial 
export const getWeeklyReport = async (req, res) => {
  try {
    const { student_id } = req.params;

    const now = new Date();
    const day = now.getDay(); // 0 (Domingo) - 6 (Sábado)
    const diffToMonday = day == 0 ? 6 : day - 1; // Ajustamos para que lunes sea inicio

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const tutorias = await tutoringModel.findAll({
      where: {
        student_id,
        date: { [Op.between]: [startOfWeek, endOfWeek] },
      },
      include: [
        {
          model: userModel,
          as: "profesor",
          include: [{ model: typeUserModel, attributes: ["type"] }],
          attributes: ["id", "user", "email"],
        },
      ],
    });

    res.json({
      student_id,
      total: tutorias.length,
      tutorias,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};