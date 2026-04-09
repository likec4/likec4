interface Contributor {
  login: string
  avatar_url: string
  html_url: string
  contributions: number
  type: string
}

interface Sponsor {
  login: string
  avatarUrl: string
  url: string
}

let contributors: Contributor[] = []
let sponsors: Sponsor[] = []

export async function fetchContributors(): Promise<Contributor[]> {
  if (contributors.length > 0) {
    return contributors
  }
  try {
    const res = await fetch('https://api.github.com/repos/likec4/likec4/contributors?per_page=100')
    if (res.ok) {
      const data: Contributor[] = await res.json()
      contributors = data.filter((c) => c.type === 'User')
    }
  } catch {
    // Silently fail
  }
  return contributors
}

export async function fetchSponsors(): Promise<Sponsor[]> {
  if (sponsors.length > 0) {
    return sponsors
  }

  const githubToken = import.meta.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN
  if (githubToken) {
    try {
      const query = `{
      organization(login: "likec4") {
        sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
          nodes {
            sponsorEntity {
              ... on User { login avatarUrl url }
              ... on Organization { login avatarUrl url }
            }
          }
        }
      }
      user(login: "davydkov") {
        sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
          nodes {
            sponsorEntity {
              ... on User { login avatarUrl url }
              ... on Organization { login avatarUrl url }
            }
          }
        }
      }
    }`
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      if (res.ok) {
        const json = await res.json()
        const orgSponsors: Sponsor[] = json.data?.organization?.sponsorshipsAsMaintainer?.nodes
          ?.map((n: any) => n.sponsorEntity)
          .filter(Boolean) ?? []
        const userSponsors: Sponsor[] = json.data?.user?.sponsorshipsAsMaintainer?.nodes
          ?.map((n: any) => n.sponsorEntity)
          .filter(Boolean) ?? []
        // Deduplicate by login
        const seen = new Set<string>(['doubleSlashde'])
        for (const s of [...orgSponsors, ...userSponsors]) {
          if (!seen.has(s.login)) {
            seen.add(s.login)
            sponsors.push(s)
          }
        }
      }
    } catch {
    }
  }
  if (sponsors.length === 0) {
    // Fallback to static data
    return [
      {
        'login': 'alexhelkar',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/1548424?v=4',
        'url': 'https://github.com/alexhelkar',
      },
      {
        'login': 'nrogoff',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/1227639?v=4',
        'url': 'https://github.com/nrogoff',
      },
      {
        'login': 'dkapitan',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/4090894?u=3da2597031e25138fb6c1e9bf0313f0cfc8abae8&v=4',
        'url': 'https://github.com/dkapitan',
      },
      {
        'login': 'MFarabi619',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/54924158?u=c47304b2ca61dbe49e55a4c0a32bf499da27fd27&v=4',
        'url': 'https://github.com/MFarabi619',
      },
      {
        'login': 'susliko',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/15569000?u=a86d6dea392430a993d5b6cd0b88806267399ca7&v=4',
        'url': 'https://github.com/susliko',
      },
      {
        'login': 'emilianionascu',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/1982577?v=4',
        'url': 'https://github.com/emilianionascu',
      },
      {
        'login': 'felipeblazing',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/16691757?v=4',
        'url': 'https://github.com/felipeblazing',
      },
      {
        'login': 'vbrvk',
        'avatarUrl': 'https://avatars.githubusercontent.com/u/9018702?v=4',
        'url': 'https://github.com/vbrvk',
      },
    ]
  }

  return sponsors
}

export async function fetchStars(): Promise<string> {
  let stars
  try {
    const res = await fetch('https://api.github.com/repos/likec4/likec4')
    if (res.ok) {
      const data = await res.json()
      const count = data.stargazers_count as number
      stars = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`
    }
  } catch {
  }
  return stars ?? '2.9k'
}

function formatCount(count: number): string {
  return count >= 1000 ? `${Math.floor(count / 1000)}k` : `${count}`
}

export async function fetchNpmDownloads(): Promise<string> {
  try {
    const res = await fetch('https://api.npmjs.org/downloads/point/last-month/likec4')
    if (res.ok) {
      const data = await res.json()
      return formatCount(data.downloads as number)
    }
  } catch {
  }
  return '48k'
}

export async function fetchIdeInstalls(): Promise<string> {
  let total = 0
  try {
    const [vscodeRes, openVsxRes] = await Promise.all([
      fetch('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json;api-version=6.1-preview.1',
        },
        body: JSON.stringify({
          filters: [{ criteria: [{ filterType: 7, value: 'likec4.likec4-vscode' }] }],
          assetTypes: [],
          flags: 914,
        }),
      }),
      fetch('https://open-vsx.org/api/likec4/likec4-vscode'),
    ])
    if (vscodeRes.ok) {
      const data = await vscodeRes.json()
      const stats: Array<{ statisticName: string; value: number }> = data.results?.[0]?.extensions?.[0]?.statistics ??
        []
      const install = stats.find(s => s.statisticName === 'install')
      if (install) total += install.value
    }
    if (openVsxRes.ok) {
      const data = await openVsxRes.json()
      if (typeof data.downloadCount === 'number') total += data.downloadCount
    }
  } catch {
  }
  return total > 0 ? formatCount(total) : '41k'
}
