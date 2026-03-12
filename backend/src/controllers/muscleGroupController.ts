import { Request, Response } from 'express';
import prisma from '../config/database';

export const getMuscleGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.muscleGroup.findMany({
      orderBy: { name: 'asc' },
    });

    const counts = await prisma.exercise.groupBy({
      by: ['muscleGroup'],
      where: { muscleGroup: { not: null } },
      _count: { muscleGroup: true },
    });

    const enriched = groups.map((group) => {
      const match = counts.find((c) => c.muscleGroup === group.name);
      return {
        ...group,
        exercisesCount: match?._count.muscleGroup ?? 0,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error en getMuscleGroups:', error);
    res.status(500).json({ success: false, message: 'Error al obtener grupos musculares' });
  }
};

export const createMuscleGroup = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }

    const existing = await prisma.muscleGroup.findUnique({ where: { name: trimmedName } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'El grupo muscular ya existe' });
    }

    const group = await prisma.muscleGroup.create({ data: { name: trimmedName } });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error('Error en createMuscleGroup:', error);
    res.status(500).json({ success: false, message: 'Error al crear grupo muscular' });
  }
};

export const updateMuscleGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }

    const group = await prisma.muscleGroup.findUnique({ where: { id: Number(id) } });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Grupo muscular no encontrado' });
    }

    if (group.name !== trimmedName) {
      const exists = await prisma.muscleGroup.findUnique({ where: { name: trimmedName } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Ya existe un grupo con ese nombre' });
      }
    }

    const updated = await prisma.muscleGroup.update({ where: { id: group.id }, data: { name: trimmedName } });
    await prisma.exercise.updateMany({ where: { muscleGroup: group.name }, data: { muscleGroup: trimmedName } });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error en updateMuscleGroup:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar grupo muscular' });
  }
};

export const deleteMuscleGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await prisma.muscleGroup.findUnique({ where: { id: Number(id) } });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Grupo muscular no encontrado' });
    }

    const deletedExercises = await prisma.exercise.deleteMany({ where: { muscleGroup: group.name } });
    await prisma.muscleGroup.delete({ where: { id: group.id } });

    res.json({
      success: true,
      message: 'Grupo muscular eliminado correctamente',
      data: { deletedExercises: deletedExercises.count },
    });
  } catch (error) {
    console.error('Error en deleteMuscleGroup:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar grupo muscular' });
  }
};
