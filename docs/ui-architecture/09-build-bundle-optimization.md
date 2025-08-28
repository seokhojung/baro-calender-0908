# Build & Bundle Optimization

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 📦 **6b. Build & Bundle Optimization**

### **6b.1 번들 최적화 및 코드 스플리팅**

#### **Next.js 번들 최적화**
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 번들 분석
      config.plugins.push(
        new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
      
      // 코드 스플리팅 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'initial',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 5,
            reuseExistingChunk: true,
          },
          calendar: {
            name: 'calendar',
            test: /[\\/]src[\\/]components[\\/]calendar[\\/]/,
            chunks: 'async',
            priority: 20,
          },
          projects: {
            name: 'projects',
            test: /[\\/]src[\\/]components[\\/]projects[\\/]/,
            chunks: 'async',
            priority: 20,
          },
        },
      }
    }
    return config
  },
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

export default nextConfig
```

#### **Webpack 최적화 설정**
```javascript
// webpack.optimization.js
const path = require('path')

module.exports = {
  // 트리 셰이킹 최적화
  usedExports: true,
  sideEffects: false,
  
  // 번들 크기 최적화
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 250000,
    minRemainingSize: 0,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    
    cacheGroups: {
      // React 관련 라이브러리
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
        name: 'react-vendor',
        chunks: 'all',
        priority: 40,
      },
      
      // UI 라이브러리
      ui: {
        test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority)[\\/]/,
        name: 'ui-vendor',
        chunks: 'all',
        priority: 30,
      },
      
      // 기타 vendor
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      
      // 공통 모듈
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  },
  
  // 미니마이제이션
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
        },
        mangle: true,
        format: {
          comments: false,
        },
      },
      extractComments: false,
    }),
    
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
          },
        ],
      },
    }),
  ],
}
```

### **6b.2 트리 셰이킹 및 데드 코드 제거**

#### **트리 셰이킹 최적화**
```typescript
// src/lib/utils/tree-shaking.ts

// ✅ 좋은 예: 명명된 임포트 사용
import { format, parseISO } from 'date-fns'
import { Button, Dialog } from '@/components/ui'

// ❌ 나쁜 예: 전체 임포트
// import * as dateFns from 'date-fns'
// import * as UI from '@/components/ui'

// 선택적 임포트를 위한 유틸리티
export const importOnDemand = {
  // 날짜 유틸리티 선택적 임포트
  dateUtils: async () => {
    const { format, parseISO, isValid } = await import('date-fns')
    return { format, parseISO, isValid }
  },
  
  // UI 컴포넌트 선택적 임포트
  uiComponents: async (components: string[]) => {
    const imports = await Promise.all(
      components.map(async (component) => {
        const module = await import(`@/components/ui/${component}`)
        return { [component]: module.default }
      })
    )
    
    return Object.assign({}, ...imports)
  },
}

// package.json에서 sideEffects 설정
/*
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/lib/polyfills.ts",
    "./src/styles/globals.css"
  ]
}
*/
```

#### **번들 분석 및 최적화**
```typescript
// scripts/analyze-bundle.ts
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import fs from 'fs'
import path from 'path'

interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  chunks: Array<{
    name: string
    size: number
    modules: string[]
  }>
}

export const analyzeBundleSize = async (): Promise<BundleAnalysis> => {
  const statsPath = path.join(process.cwd(), '.next/analyze/stats.json')
  
  if (!fs.existsSync(statsPath)) {
    throw new Error('Bundle stats not found. Run build with ANALYZE=true')
  }
  
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))
  
  return {
    totalSize: stats.assets.reduce((total: number, asset: any) => total + asset.size, 0),
    gzippedSize: stats.assets.reduce((total: number, asset: any) => total + (asset.gzipSize || 0), 0),
    chunks: stats.chunks.map((chunk: any) => ({
      name: chunk.names[0] || chunk.id,
      size: chunk.size,
      modules: chunk.modules.map((module: any) => module.name),
    })),
  }
}

// 번들 크기 체크 스크립트
export const checkBundleSize = async () => {
  const analysis = await analyzeBundleSize()
  const maxBundleSize = 250 * 1024 // 250KB
  
  console.log('📦 Bundle Analysis:')
  console.log(`Total Size: ${(analysis.totalSize / 1024).toFixed(2)}KB`)
  console.log(`Gzipped Size: ${(analysis.gzippedSize / 1024).toFixed(2)}KB`)
  
  if (analysis.gzippedSize > maxBundleSize) {
    console.error(`❌ Bundle size exceeds limit: ${(analysis.gzippedSize / 1024).toFixed(2)}KB > ${maxBundleSize / 1024}KB`)
    process.exit(1)
  }
  
  console.log('✅ Bundle size within limits')
  
  // 큰 청크 식별
  const largeChunks = analysis.chunks.filter(chunk => chunk.size > 50 * 1024)
  if (largeChunks.length > 0) {
    console.warn('⚠️ Large chunks detected:')
    largeChunks.forEach(chunk => {
      console.warn(`  ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB`)
    })
  }
}
```

### **6b.3 이미지 및 미디어 최적화**

#### **Next.js Image 컴포넌트 최적화**
```typescript
// src/components/ui/OptimizedImage.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">이미지를 불러올 수 없습니다</span>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
      
      {isLoading && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  )
}
```

#### **이미지 최적화 파이프라인**
```javascript
// scripts/optimize-images.js
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const IMAGE_FORMATS = {
  webp: { quality: 80 },
  avif: { quality: 60 },
  jpeg: { quality: 85, progressive: true },
  png: { compressionLevel: 8 },
}

const SIZES = [640, 828, 1080, 1200, 1920]

async function optimizeImages() {
  const imageDir = path.join(process.cwd(), 'public/images')
  const outputDir = path.join(process.cwd(), 'public/optimized')
  
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  const images = glob.sync('**/*.{jpg,jpeg,png}', { cwd: imageDir })
  
  for (const imagePath of images) {
    const inputPath = path.join(imageDir, imagePath)
    const baseName = path.parse(imagePath).name
    const outputPath = path.join(outputDir, baseName)
    
    console.log(`Processing: ${imagePath}`)
    
    // 원본 이미지 정보
    const metadata = await sharp(inputPath).metadata()
    
    // 다양한 크기와 형식으로 변환
    for (const size of SIZES) {
      if (size > metadata.width) continue
      
      for (const [format, options] of Object.entries(IMAGE_FORMATS)) {
        const filename = `${baseName}-${size}.${format}`
        const fullOutputPath = path.join(outputPath, filename)
        
        await sharp(inputPath)
          .resize(size)
          .toFormat(format, options)
          .toFile(fullOutputPath)
      }
    }
  }
  
  console.log('Image optimization complete!')
}

// 이미지 메타데이터 생성
async function generateImageManifest() {
  const optimizedDir = path.join(process.cwd(), 'public/optimized')
  const manifest = {}
  
  const images = glob.sync('**/*.{webp,avif,jpg,jpeg,png}', { cwd: optimizedDir })
  
  for (const imagePath of images) {
    const fullPath = path.join(optimizedDir, imagePath)
    const metadata = await sharp(fullPath).metadata()
    
    const key = path.parse(imagePath).name.replace(/-\d+$/, '')
    
    if (!manifest[key]) {
      manifest[key] = []
    }
    
    manifest[key].push({
      src: `/optimized/${imagePath}`,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: fs.statSync(fullPath).size,
    })
  }
  
  fs.writeFileSync(
    path.join(process.cwd(), 'public/image-manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
}

if (require.main === module) {
  optimizeImages().then(() => generateImageManifest())
}
```

#### **미디어 지연 로딩**
```typescript
// src/hooks/useIntersectionObserver.ts
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)
  
  useEffect(() => {
    if (!ref) return
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)
    
    observer.observe(ref)
    
    return () => observer.disconnect()
  }, [ref, options])
  
  return { ref: setRef, isIntersecting }
}

// 이미지 지연 로딩에 적용
export const LazyImage = ({ src, alt, ...props }: OptimizedImageProps) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  })
  
  if (!isIntersecting) {
    return (
      <div
        ref={ref}
        className="bg-muted animate-pulse"
        style={{ width: props.width, height: props.height }}
      />
    )
  }
  
  return <OptimizedImage ref={ref} src={src} alt={alt} {...props} />
}
```

### **6b.4 서비스 워커 및 캐싱 최적화**

#### **서비스 워커 설정**
```typescript
// public/sw.js
const CACHE_NAME = 'baro-calendar-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// 정적 자원 캐싱
const STATIC_ASSETS = [
  '/',
  '/calendar',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
]

// 설치 시 정적 자원 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // API 요청은 네트워크 우선
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 성공한 응답을 동적 캐시에 저장
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 응답
          return caches.match(request)
        })
    )
    return
  }
  
  // 정적 자원은 캐시 우선
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request)
    })
  )
})

// 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})
```

#### **HTTP/2 서버 푸시 최적화**
```typescript
// src/lib/optimization/server-push.ts
interface ServerPushResource {
  href: string
  as: 'script' | 'style' | 'font' | 'image'
  type?: string
  crossOrigin?: 'anonymous' | 'use-credentials'
}

export const serverPushResources: ServerPushResource[] = [
  {
    href: '/fonts/inter-var.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  {
    href: '/css/critical.css',
    as: 'style',
  },
  {
    href: '/js/runtime.js',
    as: 'script',
  },
]

// Next.js에서 리소스 힌트 설정
export const ResourceHints = () => {
  return (
    <Head>
      {serverPushResources.map((resource) => (
        <link
          key={resource.href}
          rel="preload"
          href={resource.href}
          as={resource.as}
          type={resource.type}
          crossOrigin={resource.crossOrigin}
        />
      ))}
      
      {/* DNS 프리페치 */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//api.example.com" />
      
      {/* 프리커넥트 */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </Head>
  )
}
```

#### **오프라인 상태 관리**
```typescript
// src/hooks/useOfflineStatus.ts
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineQueue, setOfflineQueue] = useState<any[]>([])
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // 오프라인 큐 처리
      processOfflineQueue()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  const addToOfflineQueue = useCallback((action: any) => {
    setOfflineQueue(prev => [...prev, action])
  }, [])
  
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return
    
    for (const action of offlineQueue) {
      try {
        await executeAction(action)
      } catch (error) {
        console.error('Failed to process offline action:', error)
      }
    }
    
    setOfflineQueue([])
  }, [offlineQueue])
  
  return {
    isOnline,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
  }
}
```

### **6b.5 CDN 및 에셋 배포 최적화**

#### **CDN 설정 및 최적화**
```typescript
// src/lib/cdn/asset-optimization.ts
interface CDNConfig {
  baseUrl: string
  regions: string[]
  cacheHeaders: Record<string, string>
}

export const CDN_CONFIG: CDNConfig = {
  baseUrl: process.env.CDN_BASE_URL || '',
  regions: ['us-east-1', 'eu-west-1', 'ap-northeast-1'],
  cacheHeaders: {
    // 정적 자원 - 1년 캐시
    'image/*': 'public, max-age=31536000, immutable',
    'font/*': 'public, max-age=31536000, immutable',
    'text/css': 'public, max-age=31536000, immutable',
    'application/javascript': 'public, max-age=31536000, immutable',
    
    // HTML - 짧은 캐시
    'text/html': 'public, max-age=3600, must-revalidate',
    
    // API 응답 - 캐시 없음
    'application/json': 'no-cache, no-store, must-revalidate',
  }
}

export const getAssetUrl = (path: string): string => {
  if (!CDN_CONFIG.baseUrl) return path
  
  // 개발 환경에서는 로컬 경로 사용
  if (process.env.NODE_ENV === 'development') {
    return path
  }
  
  return `${CDN_CONFIG.baseUrl}${path}`
}

// 이미지 최적화 URL 생성
export const getOptimizedImageUrl = (
  src: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpg' | 'png'
  }
): string => {
  const baseUrl = getAssetUrl(src)
  const searchParams = new URLSearchParams()
  
  if (options.width) searchParams.set('w', options.width.toString())
  if (options.height) searchParams.set('h', options.height.toString())
  if (options.quality) searchParams.set('q', options.quality.toString())
  if (options.format) searchParams.set('f', options.format)
  
  return `${baseUrl}?${searchParams.toString()}`
}
```

#### **빌드 최적화 스크립트**
```javascript
// scripts/build-optimization.js
const fs = require('fs')
const path = require('path')
const gzip = require('gzip-size')
const brotli = require('brotli-size')

async function optimizeBuild() {
  const buildDir = path.join(process.cwd(), '.next')
  
  // 정적 파일 압축 통계
  const staticDir = path.join(buildDir, 'static')
  const stats = await analyzeStaticAssets(staticDir)
  
  console.log('📊 Build Optimization Report:')
  console.log(`Total Assets: ${stats.totalFiles}`)
  console.log(`Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`Gzipped Size: ${(stats.gzippedSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`Brotli Size: ${(stats.brotliSize / 1024 / 1024).toFixed(2)}MB`)
  
  // 큰 파일 식별
  const largeFiles = stats.files.filter(file => file.size > 100 * 1024)
  if (largeFiles.length > 0) {
    console.log('\n⚠️ Large Files (>100KB):')
    largeFiles.forEach(file => {
      console.log(`  ${file.name}: ${(file.size / 1024).toFixed(2)}KB`)
    })
  }
  
  // 최적화 제안
  generateOptimizationSuggestions(stats)
}

async function analyzeStaticAssets(dir) {
  const files = []
  let totalSize = 0
  let gzippedSize = 0
  let brotliSize = 0
  
  function scanDirectory(currentDir) {
    const entries = fs.readdirSync(currentDir)
    
    entries.forEach(entry => {
      const fullPath = path.join(currentDir, entry)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath)
      } else {
        const content = fs.readFileSync(fullPath)
        const fileSize = content.length
        const gzipSize = gzip.sync(content)
        const brotliSize = brotli.sync(content)
        
        files.push({
          name: path.relative(dir, fullPath),
          size: fileSize,
          gzipSize,
          brotliSize,
        })
        
        totalSize += fileSize
        gzippedSize += gzipSize
        brotliSize += brotliSize
      }
    })
  }
  
  scanDirectory(dir)
  
  return {
    totalFiles: files.length,
    totalSize,
    gzippedSize,
    brotliSize,
    files,
  }
}

function generateOptimizationSuggestions(stats) {
  const suggestions = []
  
  // 번들 크기 체크
  const bundleFiles = stats.files.filter(f => f.name.endsWith('.js'))
  const totalBundleSize = bundleFiles.reduce((sum, f) => sum + f.gzipSize, 0)
  
  if (totalBundleSize > 250 * 1024) {
    suggestions.push('Consider splitting large bundles further')
  }
  
  // CSS 최적화
  const cssFiles = stats.files.filter(f => f.name.endsWith('.css'))
  const unusedCssSize = cssFiles.reduce((sum, f) => sum + f.size, 0)
  
  if (unusedCssSize > 50 * 1024) {
    suggestions.push('Consider purging unused CSS')
  }
  
  // 이미지 최적화
  const imageFiles = stats.files.filter(f => /\.(jpg|jpeg|png|gif)$/.test(f.name))
  const unoptimizedImages = imageFiles.filter(f => f.size > 100 * 1024)
  
  if (unoptimizedImages.length > 0) {
    suggestions.push(`Optimize ${unoptimizedImages.length} large images`)
  }
  
  if (suggestions.length > 0) {
    console.log('\n💡 Optimization Suggestions:')
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`)
    })
  }
}

if (require.main === module) {
  optimizeBuild()
}
```

---

## 📚 **관련 문서**

- [**06a-runtime-performance.md**](./06a-runtime-performance.md) - 런타임 성능 최적화
- [**05-styling-strategy.md**](./05-styling-strategy.md) - 스타일링 전략 및 테마 시스템
- [**16-ci-pipeline-performance.md**](./16-ci-pipeline-performance.md) - CI/CD 파이프라인 최적화

---

## 🎯 **요약**

이 빌드 및 번들 최적화 문서에서는 다음과 같은 핵심 영역을 다뤘습니다:

1. **번들 최적화**: Webpack 설정을 통한 코드 스플리팅 및 청크 최적화
2. **트리 셰이킹**: 불필요한 코드 제거 및 번들 크기 최소화
3. **이미지 최적화**: Next.js Image 컴포넌트와 최적화 파이프라인
4. **캐싱 전략**: 서비스 워커를 활용한 효율적인 캐싱
5. **CDN 최적화**: 글로벌 콘텐츠 배포 및 에셋 최적화
6. **빌드 분석**: 자동화된 번들 분석 및 최적화 제안

**바로캘린더 애플리케이션의 빌드 및 배포 성능을 최적화하여 사용자에게 빠른 로딩 경험을 제공하는 기반이 마련되었습니다!** 📦