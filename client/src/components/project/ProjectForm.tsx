'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from './ColorPicker';
import { 
  Project, 
  ProjectColor, 
  CreateProjectInput, 
  UpdateProjectInput,
  validateProjectName,
  validateProjectDescription,
  validateProjectColor
} from '@/types/project';

// Form validation schema
const projectFormSchema = z.object({
  name: z.string()
    .min(1, '프로젝트 이름을 입력해주세요')
    .max(100, '프로젝트 이름은 100자 이하로 입력해주세요')
    .refine(validateProjectName, '올바르지 않은 프로젝트 이름입니다'),
  description: z.string()
    .max(500, '설명은 500자 이하로 입력해주세요')
    .optional()
    .refine((val) => validateProjectDescription(val), '올바르지 않은 설명입니다'),
  color: z.string()
    .refine((val): val is ProjectColor => validateProjectColor(val), '올바른 색상을 선택해주세요'),
  isActive: z.boolean().default(true)
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project; // For editing
  onSubmit: (data: CreateProjectInput | UpdateProjectInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isLoading = false,
  className
}) => {
  const isEditing = !!project;
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      color: project?.color || 'blue',
      isActive: project?.isActive ?? true
    }
  });
  
  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };
  
  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };
  
  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className={className}
        noValidate
      >
        <div className="space-y-6">
          {/* Project Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로젝트 이름 *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="예: 개인 일정, 회사 프로젝트" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  프로젝트를 구분할 수 있는 이름을 입력하세요
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Project Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>설명</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="프로젝트에 대한 간단한 설명을 입력하세요 (선택사항)" 
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  프로젝트의 목적이나 내용을 간단히 설명해주세요
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Color Selection */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>색상 *</FormLabel>
                <FormControl>
                  <ColorPicker
                    value={field.value as ProjectColor}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  프로젝트를 시각적으로 구분할 색상을 선택하세요
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Active Status */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">프로젝트 활성화</FormLabel>
                  <FormDescription>
                    활성화된 프로젝트만 캘린더에 표시됩니다
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    aria-describedby="active-description"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !form.formState.isValid}
            className="min-w-[100px]"
          >
            {isLoading 
              ? '저장 중...' 
              : isEditing 
                ? '수정' 
                : '생성'
            }
          </Button>
        </div>
        
        {/* Form Status */}
        {form.formState.errors.root && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {form.formState.errors.root.message}
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};