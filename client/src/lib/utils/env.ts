type EnvConfig = {
  API_URL: string;
  APP_ENV: 'development' | 'staging' | 'production';
  DEBUG: boolean;
  APP_NAME: string;
  APP_VERSION: string;
};

class EnvValidator {
  private config: EnvConfig;

  constructor() {
    this.config = this.validateEnv();
  }

  private validateEnv(): EnvConfig {
    const requiredVars = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_APP_ENV'];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    return {
      API_URL: process.env.NEXT_PUBLIC_API_URL!,
      APP_ENV: process.env.NEXT_PUBLIC_APP_ENV as 'development' | 'staging' | 'production',
      DEBUG: process.env.NEXT_PUBLIC_DEBUG === 'true',
      APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || '바로캘린더',
      APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    };
  }

  get(): EnvConfig {
    return this.config;
  }

  isDevelopment(): boolean {
    return this.config.APP_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.APP_ENV === 'production';
  }
}

export const env = new EnvValidator();