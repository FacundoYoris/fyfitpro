import { ReactNode } from 'react';
import { Activity, Dumbbell, Footprints, Shield, Target, AlignJustify, Waves } from 'lucide-react';

const iconSize = 16;

const iconMap: Record<string, ReactNode> = {
  Pecho: <AlignJustify size={iconSize} />, 
  Espalda: <Shield size={iconSize} />, 
  Hombros: <Target size={iconSize} />, 
  Bíceps: <Dumbbell size={iconSize} />, 
  Tríceps: <Dumbbell size={iconSize} />, 
  Piernas: <Footprints size={iconSize} />, 
  Abdomen: <Waves size={iconSize} />, 
  General: <Activity size={iconSize} />, 
};

export const getMuscleIcon = (muscleGroup: string): ReactNode => iconMap[muscleGroup] || <Activity size={iconSize} />;
