'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectForm } from './ProjectForm';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project';
import useProjectStore from '@/stores/projectStore';

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project; // For editing
  mode?: 'create' | 'edit';
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  open,
  onOpenChange,
  project,
  mode = project ? 'edit' : 'create'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject, updateProject } = useProjectStore();
  
  const isEditing = mode === 'edit' && !!project;
  
  const handleSubmit = async (data: CreateProjectInput | UpdateProjectInput) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && project) {
        await updateProject(project.id, data as UpdateProjectInput);
      } else {
        await createProject(data as CreateProjectInput);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '프로젝트 편집' : '새 프로젝트 만들기'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `"${project?.name}" 프로젝트의 정보를 수정합니다.`
              : '새로운 프로젝트를 생성하여 일정을 체계적으로 관리하세요.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};