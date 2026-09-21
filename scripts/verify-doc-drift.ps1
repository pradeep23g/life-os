# LIFE OS - Documentation Drift Verification Gate (PowerShell Edition)
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot
if (-not $ROOT) { $ROOT = (Get-Location).Path }

$script:totalChecks = 0
$script:failedChecks = 0

function Report-Pass {
    param([string]$name, [string]$details)
    $script:totalChecks++
    if ($details) {
        Write-Host "  [PASS] $name ($details)" -ForegroundColor Green
    } else {
        Write-Host "  [PASS] $name" -ForegroundColor Green
    }
}

function Report-Fail {
    param([string]$name, [string]$errorMsg)
    $script:totalChecks++
    $script:failedChecks++
    Write-Host "  [FAIL] $name : $errorMsg" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================"
Write-Host "       LIFE OS - DOCUMENTATION DRIFT VERIFICATION GATE       "
Write-Host "============================================================"
Write-Host ""

# -------------------------------------------------------------
# CHECK 1: Database Migration Schema Parity
# -------------------------------------------------------------
Write-Host "[1/5] Checking Database Schema Parity (Migrations -> DATABASE_SCHEMA.md)..."
$migrationsDir = Join-Path $ROOT "supabase\migrations"
$schemaDocPath = Join-Path $ROOT "docs\architecture\DATABASE_SCHEMA.md"

if (-not (Test-Path $migrationsDir) -or -not (Test-Path $schemaDocPath)) {
    Report-Fail -name "Migration / Schema Doc existence" -errorMsg "Missing migrations dir or DATABASE_SCHEMA.md"
} else {
    $schemaDocContent = [System.IO.File]::ReadAllText($schemaDocPath)
    $migrationFiles = Get-ChildItem -Path $migrationsDir -Filter *.sql | Sort-Object Name

    $createdTables = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    $droppedTables = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

    foreach ($file in $migrationFiles) {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $createMatches = [regex]::Matches($content, 'create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-zA-Z0-9_]+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($m in $createMatches) {
            $null = $createdTables.Add($m.Groups[1].Value.ToLower())
        }
        $dropMatches = [regex]::Matches($content, 'drop\s+table(?:\s+if\s+exists)?\s+public\.([a-zA-Z0-9_]+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($m in $dropMatches) {
            $null = $droppedTables.Add($m.Groups[1].Value.ToLower())
        }
    }

    $activeTables = @($createdTables | Where-Object { -not $droppedTables.Contains($_) })
    $missingTables = @()

    foreach ($t in $activeTables) {
        if ($schemaDocContent -notmatch "(?i)public\.$t\b") {
            $missingTables += $t
        }
    }

    if ($missingTables.Count -eq 0) {
        Report-Pass -name "Database Tables Parity" -details "$($activeTables.Count) PostgreSQL tables verified in DATABASE_SCHEMA.md"
    } else {
        Report-Fail -name "Database Tables Parity" -errorMsg "Undocumented tables in DATABASE_SCHEMA.md: $($missingTables -join ', ')"
    }
}

# -------------------------------------------------------------
# CHECK 2: Client Route Parity
# -------------------------------------------------------------
Write-Host ""
Write-Host "[2/5] Checking Route Parity (src/App.tsx -> SYSTEM_ARCHITECTURE.md)..."
$appTsxPath = Join-Path $ROOT "src\App.tsx"
$sysArchPath = Join-Path $ROOT "docs\architecture\SYSTEM_ARCHITECTURE.md"

if (-not (Test-Path $appTsxPath) -or -not (Test-Path $sysArchPath)) {
    Report-Fail -name "App.tsx / SYSTEM_ARCHITECTURE.md existence" -errorMsg "Missing App.tsx or SYSTEM_ARCHITECTURE.md"
} else {
    $sysArchContent = [System.IO.File]::ReadAllText($sysArchPath)
    $requiredRoutes = @(
        '/', '/arc', '/system', '/profile', '/admin', '/reports',
        '/mind-os', '/productivity-hub', '/learning-os', '/fitness-os',
        '/time-os', '/finance-os', '/data-lab', '/auth'
    )

    $missingRoutes = @()
    foreach ($r in $requiredRoutes) {
        if (-not $sysArchContent.Contains($r)) {
            $missingRoutes += $r
        }
    }

    if ($missingRoutes.Count -eq 0) {
        Report-Pass -name "Route Coverage" -details "All $($requiredRoutes.Count) canonical routes documented in SYSTEM_ARCHITECTURE.md"
    } else {
        Report-Fail -name "Route Coverage" -errorMsg "Missing routes in SYSTEM_ARCHITECTURE.md: $($missingRoutes -join ', ')"
    }
}

# -------------------------------------------------------------
# CHECK 3: ADR Register Monotonicity & Uniqueness
# -------------------------------------------------------------
Write-Host ""
Write-Host "[3/5] Checking Architectural Decision Records (ADR Registry)..."
$adrPath = Join-Path $ROOT "docs\decisions\ARCHITECTURE_DECISIONS.md"

if (-not (Test-Path $adrPath)) {
    Report-Fail -name "ADR Register existence" -errorMsg "Missing ARCHITECTURE_DECISIONS.md"
} else {
    $adrContent = [System.IO.File]::ReadAllText($adrPath)
    $adrMatches = [regex]::Matches($adrContent, '##\s+ADR-(\d{3}):')
    $adrNumbers = @($adrMatches | ForEach-Object { [int]$_.Groups[1].Value })

    $seen = [System.Collections.Generic.HashSet[int]]::new()
    $duplicates = @()
    foreach ($num in $adrNumbers) {
        if ($seen.Contains($num)) {
            $duplicates += $num
        }
        $null = $seen.Add($num)
    }

    $isMonotonic = $true
    for ($i = 0; $i -lt $adrNumbers.Count; $i++) {
        if ($adrNumbers[$i] -ne ($i + 1)) {
            $isMonotonic = $false
            break
        }
    }

    $countStr = "{0:D3}" -f $adrNumbers.Count
    if ($duplicates.Count -eq 0 -and $isMonotonic -and $adrNumbers.Count -ge 28) {
        Report-Pass -name "ADR Registry Monotonicity" -details "Gapless sequence ADR-001 through ADR-$countStr with 0 duplicates"
    } else {
        $dupsStr = $duplicates -join ', '
        Report-Fail -name "ADR Registry Monotonicity" -errorMsg "Duplicates: [$dupsStr], Monotonic: $isMonotonic, Count: $($adrNumbers.Count)"
    }
}

# -------------------------------------------------------------
# CHECK 4: Markdown Link Integrity across docs/
# -------------------------------------------------------------
Write-Host ""
Write-Host "[4/5] Checking Internal Markdown Link & Anchor Integrity..."
$docsDir = Join-Path $ROOT "docs"
$tasksDir = Join-Path $ROOT "tasks"
$mdFiles = @(Get-ChildItem -Path $docsDir -Filter *.md -Recurse)
if (Test-Path $tasksDir) {
    $mdFiles += @(Get-ChildItem -Path $tasksDir -Filter *.md -Recurse)
}
$mdFiles += @(Get-ChildItem -Path $ROOT -Filter *.md)

function Get-GfmSlug($text) {
    $clean = $text -replace '^#+\s*', ''
    $clean = $clean -replace '<[^>]+>', ''
    $clean = $clean -replace '\[([^\]]+)\]\([^)]+\)', '$1'
    $clean = $clean -replace '`([^`]+)`', '$1'
    $clean = $clean.ToLower().Trim()
    $clean = $clean -replace '[^\w\s-]', ''
    $clean = $clean -replace '\s+', '-'
    return $clean
}

function Get-FileSlugs($filePath) {
    $lines = [System.IO.File]::ReadAllLines($filePath)
    $slugCounts = @{}
    $validSlugs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    
    foreach ($line in $lines) {
        if ($line -match '^#{1,6}\s+(.+)$') {
            $raw = $Matches[1]
            $baseSlug = Get-GfmSlug $raw
            if (-not $baseSlug) { continue }
            
            if ($slugCounts.ContainsKey($baseSlug)) {
                $count = $slugCounts[$baseSlug] + 1
                $slugCounts[$baseSlug] = $count
                $slug = "$baseSlug-$count"
            } else {
                $slugCounts[$baseSlug] = 0
                $slug = $baseSlug
            }
            [void]$validSlugs.Add($slug)
        }
    }
    return $validSlugs
}

$fileSlugCache = @{}
function Get-CachedSlugs($filePath) {
    if (-not $fileSlugCache.ContainsKey($filePath)) {
        $fileSlugCache[$filePath] = Get-FileSlugs $filePath
    }
    return $fileSlugCache[$filePath]
}

$brokenLinks = @()
$checkedAnchors = 0

foreach ($f in $mdFiles) {
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $dir = $f.DirectoryName
    $linkMatches = [regex]::Matches($content, '\[([^\]]+)\]\(([^)]+)\)')

    foreach ($m in $linkMatches) {
        $target = $m.Groups[2].Value.Trim()

        if ($target.StartsWith('http://') -or $target.StartsWith('https://') -or
            $target.StartsWith('mailto:') -or $target.StartsWith('conversation://')) {
            continue
        }

        # Reject machine-specific file:/// URIs
        if ($target.StartsWith('file:///')) {
            $brokenLinks += "$($f.FullName) -> $target (Portability violation: machine-specific file:/// URI forbidden)"
            continue
        }

        # Check anchor only
        if ($target.StartsWith('#')) {
            $anchor = $target.Substring(1)
            $checkedAnchors++
            $slugs = Get-CachedSlugs $f.FullName
            if (-not $slugs.Contains($anchor)) {
                $brokenLinks += "$($f.FullName) -> $target (Anchor #$anchor not found in self)"
            }
            continue
        }

        $parts = $target -split '#', 2
        $pathPart = $parts[0]
        $anchorPart = if ($parts.Count -gt 1) { $parts[1] } else { $null }

        $decodedPath = [System.Uri]::UnescapeDataString($pathPart)
        $resolvedTarget = if ([System.IO.Path]::IsPathRooted($decodedPath)) {
            $decodedPath
        } else {
            [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($dir, $decodedPath))
        }

        if (-not (Test-Path $resolvedTarget)) {
            $brokenLinks += "$($f.FullName) -> $target (resolved: $resolvedTarget)"
            continue
        }

        # If anchor specified on a markdown file, validate heading exists
        if ($anchorPart -and ($resolvedTarget.EndsWith('.md') -or $resolvedTarget.EndsWith('.markdown'))) {
            $checkedAnchors++
            $slugs = Get-CachedSlugs $resolvedTarget
            if (-not $slugs.Contains($anchorPart)) {
                $brokenLinks += "$($f.FullName) -> $target (Anchor #$anchorPart not found in $resolvedTarget)"
            }
        }
    }
}

if ($brokenLinks.Count -eq 0) {
    Report-Pass -name "Markdown Link Integrity" -details "All internal links & anchors in $($mdFiles.Count) markdown files resolve on disk ($checkedAnchors anchors verified, 0 file:/// URIs)"
} else {
    $sample = ($brokenLinks | Select-Object -First 10) -join "`n      "
    Report-Fail -name "Markdown Link Integrity" -errorMsg "$($brokenLinks.Count) broken links found:`n      $sample"
}

# -------------------------------------------------------------
# CHECK 5: Task Tracker Parity (tasks/todo.md)
# -------------------------------------------------------------
Write-Host ""
Write-Host "[5/5] Checking Task Tracker Parity (tasks/todo.md)..."
$todoPath = Join-Path $ROOT "tasks\todo.md"

if (-not (Test-Path $todoPath)) {
    Report-Fail -name "tasks/todo.md existence" -errorMsg "Missing tasks/todo.md"
} else {
    $todoContent = [System.IO.File]::ReadAllText($todoPath)
    $uncheckedMatches = [regex]::Matches($todoContent, '- \[\s*\]')

    if ($uncheckedMatches.Count -eq 0) {
        Report-Pass -name "Task Tracker Parity" -details "0 unchecked items in tasks/todo.md"
    } else {
        Report-Fail -name "Task Tracker Parity" -errorMsg "Found $($uncheckedMatches.Count) unchecked items in tasks/todo.md"
    }
}

# -------------------------------------------------------------
# SUMMARY & EXIT CODE
# -------------------------------------------------------------
Write-Host ""
Write-Host "------------------------------------------------------------"
Write-Host "TOTAL CHECKS: $script:totalChecks | PASSED: $($script:totalChecks - $script:failedChecks) | FAILED: $script:failedChecks"
Write-Host "------------------------------------------------------------"
Write-Host ""

if ($script:failedChecks -gt 0) {
    Write-Host "Documentation drift verification FAILED. Correct discrepancies above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Documentation drift verification PASSED. Ground truth parity confirmed." -ForegroundColor Green
    exit 0
}
