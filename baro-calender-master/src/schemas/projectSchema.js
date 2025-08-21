const Joi = require('joi');

// 프로젝트 생성 스키마
const createProjectSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': '프로젝트명은 필수입니다',
      'string.min': '프로젝트명은 최소 1자 이상이어야 합니다',
      'string.max': '프로젝트명은 최대 100자까지 가능합니다',
      'any.required': '프로젝트명은 필수입니다'
    }),
  
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default('#3B82F6')
    .messages({
      'string.pattern.base': '올바른 색상 코드 형식이 아닙니다 (예: #FF6B6B)'
    }),
  
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': '프로젝트 설명은 최대 1000자까지 가능합니다'
    }),
  
  settings: Joi.object()
    .default({})
    .optional()
});

// 프로젝트 수정 스키마
const updateProjectSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': '프로젝트명은 비어있을 수 없습니다',
      'string.min': '프로젝트명은 최소 1자 이상이어야 합니다',
      'string.max': '프로젝트명은 최대 100자까지 가능합니다'
    }),
  
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': '올바른 색상 코드 형식이 아닙니다 (예: #FF6B6B)'
    }),
  
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': '프로젝트 설명은 최대 1000자까지 가능합니다'
    }),
  
  settings: Joi.object()
    .optional()
});

// 프로젝트 ID 검증 스키마
const projectIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '프로젝트 ID는 숫자여야 합니다',
      'number.integer': '프로젝트 ID는 정수여야 합니다',
      'number.positive': '프로젝트 ID는 양수여야 합니다',
      'any.required': '프로젝트 ID는 필수입니다'
    })
});

// 프로젝트 목록 조회 쿼리 스키마
const listProjectsQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(100)
    .optional()
    .messages({
      'number.base': 'limit은 숫자여야 합니다',
      'number.integer': 'limit은 정수여야 합니다',
      'number.min': 'limit은 최소 1 이상이어야 합니다',
      'number.max': 'limit은 최대 1000까지 가능합니다'
    }),
  
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.base': 'offset은 숫자여야 합니다',
      'number.integer': 'offset은 정수여야 합니다',
      'number.min': 'offset은 0 이상이어야 합니다'
    }),
  
  search: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': '검색어는 최대 100자까지 가능합니다'
    })
});

// 프로젝트 검색 쿼리 스키마
const searchProjectsQuerySchema = Joi.object({
  q: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': '검색어는 필수입니다',
      'string.min': '검색어는 최소 1자 이상이어야 합니다',
      'string.max': '검색어는 최대 100자까지 가능합니다',
      'any.required': '검색어는 필수입니다'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .optional(),
  
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  listProjectsQuerySchema,
  searchProjectsQuerySchema
};
