'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ProjectList } from './ProjectList';
import { ProjectModal } from './ProjectModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Project } from '@/types/project';
import useProjectStore from '@/stores/projectStore';

interface ProjectManagementProps {
  className?: string;
}

export const ProjectManagement: React.FC<ProjectManagementProps> = ({
  className
}) => {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Selected project for editing/deleting
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Store hook
  const { deleteProject } = useProjectStore();
  
  // Create project handlers
  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsCreateModalOpen(true);
  };
  
  // Edit project handlers
  const handleEditProject = (project: Project) => {
    if (!project.permissions.canWrite) {
      toast.error('이 프로젝트를 편집할 권한이 없습니다');
      return;
    }
    
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };
  
  // Delete project handlers
  const handleDeleteProject = (project: Project) => {
    if (!project.permissions.canDelete) {
      toast.error('이 프로젝트를 삭제할 권한이 없습니다');
      return;
    }
    
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteProject = async () => {
    if (!selectedProject) return;
    
    setIsDeleting(true);
    
    try {
      await deleteProject(selectedProject.id);
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const cancelDeleteProject = () => {
    setIsDeleteDialogOpen(false);
    setSelectedProject(null);
  };
  
  return (
    <div className={className}>
      {/* Main Project List */}
      <ProjectList
        onCreateProject={handleCreateProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
      />
      
      {/* Create Project Modal */}
      <ProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
      />
      
      {/* Edit Project Modal */}
      <ProjectModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        project={selectedProject || undefined}
        mode="edit"
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              프로젝트 삭제
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>"{selectedProject?.name}"</strong> 프로젝트를 정말로 삭제하시겠습니까?
              </p>
              <p className="text-sm text-red-600">
                ⚠️ 이 작업은 되돌릴 수 없습니다. 프로젝트와 관련된 모든 일정이 함께 삭제됩니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteProject} disabled={isDeleting}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};