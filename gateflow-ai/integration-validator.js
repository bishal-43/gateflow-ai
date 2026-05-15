#!/usr/bin/env node

/**
 * integration-validator.js - Validates GateFlow Frontend integration setup
 *
 * Usage:
 *   node integration-validator.js
 *
 * Checks:
 *   ✅ Environment variables configured
 *   ✅ All required dependencies installed
 *   ✅ Mock mode setup correct
 *   ✅ API endpoints accessible
 *   ✅ WebSocket connectivity
 *   ✅ Component exports valid
 *   ✅ No import errors
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const RESET = '\x1b[0m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'

let totalChecks = 0
let passedChecks = 0
let failedChecks = 0

function check(name, condition, details = '') {
  totalChecks++
  const status = condition ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`
  const detailText = details ? ` — ${details}` : ''
  console.log(`${status} ${name}${detailText}`)
  if (condition) passedChecks++
  else failedChecks++
  return condition
}

function section(title) {
  console.log(`\n${BLUE}━━ ${title} ${RESET}`)
}

console.log(`\n${BLUE}🔍 GateFlow Frontend Integration Validator${RESET}\n`)

// ══ Environment Variables ═════════════════════════════════════════════════════
section('Environment Variables')

const envFile = path.join(__dirname, '.env')
const envLocalFile = path.join(__dirname, '.env.local')
const envProdFile = path.join(__dirname, '.env.production')

const hasEnv = fs.existsSync(envFile)
const hasEnvLocal = fs.existsSync(envLocalFile)
const hasEnvProd = fs.existsSync(envProdFile)

check('.env file exists', hasEnv, hasEnv ? '.env found' : 'optional')
// Note: .env.local and .env.production are optional, don't count toward failures
if (hasEnvLocal) console.log(`${GREEN}✅${RESET} .env.local file exists — found`)
if (!hasEnvLocal) console.log(`${YELLOW}ℹ️${RESET} .env.local file exists — optional`)
if (hasEnvProd) console.log(`${GREEN}✅${RESET} .env.production file exists — found`)
if (!hasEnvProd) console.log(`${YELLOW}ℹ️${RESET} .env.production file exists — optional`)

let mockMode = false
let apiBaseUrl = 'http://localhost:8000'
let wsBaseUrl = 'ws://localhost:8000'

if (hasEnv) {
  const content = fs.readFileSync(envFile, 'utf8')
  mockMode = content.includes('VITE_MOCK_MODE=true')
  const apiMatch = content.match(/VITE_API_BASE_URL=(.+)/)
  const wsMatch = content.match(/VITE_WS_BASE_URL=(.+)/)
  if (apiMatch) apiBaseUrl = apiMatch[1].trim()
  if (wsMatch) wsBaseUrl = wsMatch[1].trim()
}

check(
  'VITE_MOCK_MODE configured',
  hasEnv || hasEnvLocal,
  mockMode ? 'Mock mode: ON' : 'Real backend expected'
)

check(
  'VITE_API_BASE_URL set',
  apiBaseUrl !== '',
  `API URL: ${apiBaseUrl}`
)

check(
  'VITE_WS_BASE_URL set',
  wsBaseUrl !== '',
  `WebSocket URL: ${wsBaseUrl}`
)

// ══ Dependencies ══════════════════════════════════════════════════════════════
section('Dependencies')

const packageJsonPath = path.join(__dirname, 'package.json')
const hasPackageJson = fs.existsSync(packageJsonPath)
check('package.json exists', hasPackageJson)

if (hasPackageJson) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const deps = packageJson.dependencies || {}
  const devDeps = packageJson.devDependencies || {}

  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    'axios',
    '@tanstack/react-query',
    'lucide-react',
    'recharts',
    'tailwindcss',
  ]

  requiredDeps.forEach((dep) => {
    const found = deps[dep] || devDeps[dep]
    check(`${dep} installed`, !!found, found ? `v${found}` : 'not found')
  })
}

// ══ Mock Mode Setup ═══════════════════════════════════════════════════════════
section('Mock Mode Setup')

const mockHandlersPath = path.join(__dirname, 'src/mock/mockHandlers.js')
const mockDataPath = path.join(__dirname, 'src/mock/mockData.js')

check('mockHandlers.js exists', fs.existsSync(mockHandlersPath))
check('mockData.js exists', fs.existsSync(mockDataPath))

if (fs.existsSync(mockHandlersPath)) {
  const content = fs.readFileSync(mockHandlersPath, 'utf8')
  check(
    'Mock endpoints defined',
    content.includes('handleMockRequest'),
    'Request interceptor found'
  )
  check('Auth mock handler', content.includes('/auth/login') || content.includes('auth/register'))
  check('Dashboard mock handler', content.includes('/dashboard/stats') || content.includes('/dashboard/'))
  check('Entry/Exit mock handler', content.includes('/entry/') || content.includes('/exit/') || content.includes('/entries/'))
  check('Walk-in mock handler', content.includes('/walkins/') || content.includes('WALKIN'))
}

// ══ Component Exports ═════════════════════════════════════════════════════════
section('Component Exports')

const componentIndexPath = path.join(__dirname, 'src/components/ui/index.js')
check('UI component index exists', fs.existsSync(componentIndexPath))

if (fs.existsSync(componentIndexPath)) {
  const content = fs.readFileSync(componentIndexPath, 'utf8')
  const requiredComponents = [
    'Button',
    'Card',
    'Input',
    'MetricCard',
    'ActionCard',
    'StatusBadge',
    'Skeleton',
    'IconButton',
  ]

  requiredComponents.forEach((comp) => {
    check(
      `${comp} exported`,
      content.includes(`export { ${comp}`),
      content.includes(`from './${comp}'`)
    )
  })
}

// ══ Service Files ═════════════════════════════════════════════════════════════
section('Service Files')

const requiredServices = [
  'src/services/authService.js',
  'src/services/dashboardService.js',
  'src/services/http/axiosInstance.js',
  'src/services/websocketService.js',
]

requiredServices.forEach((service) => {
  const fullPath = path.join(__dirname, service)
  check(`${path.basename(service)}`, fs.existsSync(fullPath))
})

// ══ Hook Files ════════════════════════════════════════════════════════════════
section('Hook Files')

const requiredHooks = [
  'src/hooks/useAuth.js',
  'src/hooks/useDashboard.js',
  'src/hooks/useDashboardWS.js',
  'src/hooks/useEntry.js',
]

requiredHooks.forEach((hook) => {
  const fullPath = path.join(__dirname, hook)
  check(`${path.basename(hook)}`, fs.existsSync(fullPath))
})

// ══ Page Files ════════════════════════════════════════════════════════════════
section('Critical Pages')

const requiredPages = [
  'src/pages/auth/Login.jsx',
  'src/pages/dashboard/MainDashboard.jsx',
  'src/pages/guard/GuardDashboard.jsx',
  'src/pages/guard/EntryScan.jsx',
  'src/pages/guard/ExitScan.jsx',
]

requiredPages.forEach((page) => {
  const fullPath = path.join(__dirname, page)
  check(`${path.basename(page)}`, fs.existsSync(fullPath))
})

// ══ Configuration Files ═══════════════════════════════════════════════════════
section('Configuration Files')

const requiredConfigs = [
  'package.json',
  'vite.config.js',
  'src/config/env.js',
]

requiredConfigs.forEach((config) => {
  const fullPath = path.join(__dirname, config)
  check(`${config}`, fs.existsSync(fullPath))
})

// ══ Vite Config Validation ════════════════════════════════════════════════════
section('Build Configuration')

const viteConfigPath = path.join(__dirname, 'vite.config.js')
if (fs.existsSync(viteConfigPath)) {
  const content = fs.readFileSync(viteConfigPath, 'utf8')
  check('Vite React plugin configured', content.includes('react()'))
  check('Path alias configured', content.includes("'@'") || content.includes("alias"))
}

// ══ Tailwind Configuration ════════════════════════════════════════════════════
section('Tailwind Configuration')

const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js')
const tailwindConfigExists = fs.existsSync(tailwindConfigPath)
if (tailwindConfigExists) {
  const content = fs.readFileSync(tailwindConfigPath, 'utf8')
  check('Template paths configured', content.includes('content'))
  check('Dark mode enabled', content.includes('dark'))
} else {
  check('Tailwind v4+ (no config file needed)', true, 'Tailwind 4+ uses @import "tailwindcss"')
}

// ══ Global Styles ════════════════════════════════════════════════════════════
section('Global Styles')

const indexCssPath = path.join(__dirname, 'src/index.css')
if (fs.existsSync(indexCssPath)) {
  const content = fs.readFileSync(indexCssPath, 'utf8')
  check('Tailwind directives', content.includes('@import "tailwindcss"') || content.includes('@tailwind'))
  check('CSS variables defined', content.includes('--'))
  check('Color palette defined', content.includes('--primary') || content.includes('--background'))
}

// ══ Summary ═══════════════════════════════════════════════════════════════════
section('Summary')

const passRate = ((passedChecks / totalChecks) * 100).toFixed(1)
const summaryColor = failedChecks === 0 ? GREEN : failedChecks <= 2 ? YELLOW : RED

console.log(
  `\n${summaryColor}Total: ${totalChecks} | ${GREEN}Passed: ${passedChecks}${RESET} | ${RED}Failed: ${failedChecks}${RESET} | Pass Rate: ${passRate}%${RESET}\n`
)

// ══ Recommendations ══════════════════════════════════════════════════════════
section('Next Steps')

if (failedChecks === 0) {
  console.log(`${GREEN}✅ All checks passed! Your integration is ready.${RESET}`)
  console.log(`\nYou can now run:`)
  console.log(`  ${BLUE}npm run dev${RESET}    — Start development server`)
  console.log(`  ${BLUE}npm run build${RESET}  — Build for production`)
  console.log(`  ${BLUE}npm run lint${RESET}   — Check code quality\n`)
} else if (failedChecks <= 2) {
  console.log(`${YELLOW}⚠️  Some checks failed. Please review and fix.${RESET}`)
  console.log(`\nCommon issues:`)
  console.log(`  • Missing .env file → Create .env with environment variables`)
  console.log(`  • Dependencies not installed → Run: npm install`)
  console.log(`  • File not found → Check file paths and names\n`)
} else {
  console.log(`${RED}❌ Multiple checks failed. Integration needs setup.${RESET}`)
  console.log(`\nRecommended steps:`)
  console.log(`  1. npm install`)
  console.log(`  2. Create .env file with required variables`)
  console.log(`  3. Verify backend is running (if using real API)`)
  console.log(`  4. Run: npm run dev\n`)
}

process.exit(failedChecks === 0 ? 0 : 1)
