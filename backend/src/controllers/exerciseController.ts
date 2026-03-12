import { Request, Response } from 'express';
import prisma from '../config/database';

export const getExercises = async (req: Request, res: Response) => {
  try {
    const { muscleGroup } = req.query;
    const whereClause: any = { isActive: true };

    if (muscleGroup) {
      whereClause.muscleGroup = muscleGroup;
    }

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    console.error('Error en getExercises:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ejercicios',
    });
  }
};

export const getExerciseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const exercise = await prisma.exercise.findUnique({
      where: { id: Number(id) },
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado',
      });
    }

    res.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('Error en getExerciseById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ejercicio',
    });
  }
};

export const createExercise = async (req: Request, res: Response) => {
  try {
    const { name, muscleGroup, description, defaultSets, defaultReps, repScheme } = req.body;

    if (muscleGroup) {
      const existingGroup = await prisma.muscleGroup.findUnique({ where: { name: muscleGroup } });
      if (!existingGroup) {
        return res.status(400).json({ success: false, message: 'El grupo muscular no existe' });
      }
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        muscleGroup,
        description,
        defaultSets: defaultSets || 3,
        defaultReps: defaultReps || 10,
        repScheme: repScheme || null,
      },
    });

    res.status(201).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('Error en createExercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear ejercicio',
    });
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, muscleGroup, description, defaultSets, defaultReps, repScheme, isActive } = req.body;

    const exercise = await prisma.exercise.findUnique({ where: { id: Number(id) } });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado',
      });
    }

    if (muscleGroup) {
      const existingGroup = await prisma.muscleGroup.findUnique({ where: { name: muscleGroup } });
      if (!existingGroup) {
        return res.status(400).json({ success: false, message: 'El grupo muscular no existe' });
      }
    }

    const updatedExercise = await prisma.exercise.update({
      where: { id: Number(id) },
      data: {
        name: name || exercise.name,
        muscleGroup: muscleGroup !== undefined ? muscleGroup : exercise.muscleGroup,
        description: description !== undefined ? description : exercise.description,
        defaultSets: defaultSets || exercise.defaultSets,
        defaultReps: defaultReps || exercise.defaultReps,
        repScheme: repScheme !== undefined ? repScheme : exercise.repScheme,
        isActive: isActive !== undefined ? isActive : exercise.isActive,
      },
    });

    res.json({
      success: true,
      data: updatedExercise,
    });
  } catch (error) {
    console.error('Error en updateExercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ejercicio',
    });
  }
};

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const exercise = await prisma.exercise.findUnique({ where: { id: Number(id) } });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado',
      });
    }

    await prisma.exercise.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Ejercicio eliminado correctamente',
    });
  } catch (error) {
    console.error('Error en deleteExercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ejercicio',
    });
  }
};
