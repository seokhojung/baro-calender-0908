const Joi = require('joi');

// 멤버 초대 스키마
const inviteMemberSchema = Joi.object({
  user_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '사용자 ID는 숫자여야 합니다',
      'number.integer': '사용자 ID는 정수여야 합니다',
      'number.positive': '사용자 ID는 양수여야 합니다',
      'any.required': '사용자 ID는 필수입니다'
    }),
  
  role: Joi.string()
    .valid('Owner', 'Editor', 'Commenter', 'Viewer')
    .required()
    .messages({
      'string.empty': '역할은 필수입니다',
      'any.only': '역할은 Owner, Editor, Commenter, Viewer 중 하나여야 합니다',
      'any.required': '역할은 필수입니다'
    })
});

// 멤버 역할 변경 스키마
const updateMemberRoleSchema = Joi.object({
  role: Joi.string()
    .valid('Owner', 'Editor', 'Commenter', 'Viewer')
    .required()
    .messages({
      'string.empty': '새로운 역할은 필수입니다',
      'any.only': '역할은 Owner, Editor, Commenter, Viewer 중 하나여야 합니다',
      'any.required': '새로운 역할은 필수입니다'
    })
});

// 멤버 ID 검증 스키마
const memberIdSchema = Joi.object({
  project_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '프로젝트 ID는 숫자여야 합니다',
      'number.integer': '프로젝트 ID는 정수여야 합니다',
      'number.positive': '프로젝트 ID는 양수여야 합니다',
      'any.required': '프로젝트 ID는 필수입니다'
    }),
  
  user_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '사용자 ID는 숫자여야 합니다',
      'number.integer': '사용자 ID는 정수여야 합니다',
      'number.positive': '사용자 ID는 양수여야 합니다',
      'any.required': '사용자 ID는 필수입니다'
    })
});

// 멤버 목록 조회 쿼리 스키마
const listMembersQuerySchema = Joi.object({
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
  
  role: Joi.string()
    .valid('Owner', 'Editor', 'Commenter', 'Viewer')
    .optional()
    .messages({
      'any.only': '역할은 Owner, Editor, Commenter, Viewer 중 하나여야 합니다'
    }),
  
  search: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': '검색어는 최대 100자까지 가능합니다'
    })
});

// 멤버 검색 쿼리 스키마
const searchMembersQuerySchema = Joi.object({
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

// 멤버 일괄 초대 스키마
const bulkInviteMembersSchema = Joi.object({
  members: Joi.array()
    .items(inviteMemberSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': '멤버 목록은 배열이어야 합니다',
      'array.min': '최소 1명 이상의 멤버를 초대해야 합니다',
      'array.max': '최대 100명까지 일괄 초대 가능합니다',
      'any.required': '멤버 목록은 필수입니다'
    })
});

// 멤버 통계 쿼리 스키마
const memberStatsQuerySchema = Joi.object({
  include_details: Joi.boolean()
    .default(false)
    .optional()
    .messages({
      'boolean.base': 'include_details는 boolean 값이어야 합니다'
    })
});

module.exports = {
  inviteMemberSchema,
  updateMemberRoleSchema,
  memberIdSchema,
  listMembersQuerySchema,
  searchMembersQuerySchema,
  bulkInviteMembersSchema,
  memberStatsQuerySchema
};
