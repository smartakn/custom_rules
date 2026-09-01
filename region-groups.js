'use strict';

const MANAGED_PROVIDER = 'provider1';
const MANUAL_GROUP = '🚀 手动选择';
const DIRECT_GROUP = '🎯 全球直连';
const PRIVATE_GROUP = '🔐 Private';
const PRIVATE_GROUP_KEY = 'PRIVATE';
const BUILTIN_OUTBOUNDS = new Set([
    'DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE', 'GLOBAL', 'DNS',
]);
const CHINESE_REGION_KEYS = new Set(['CN', 'TW', 'HK', 'MO']);
const CHINESE_REGION_PRIORITY = ['TW', 'HK', 'MO', 'CN'];

const PREFERRED_REGION_ORDER = [
    'HK', 'US', 'JP', 'SG', 'TW', 'DE', 'GB', 'NL', 'AU',
];

const REGION_NAMES = Object.freeze({
    HK: '香港', US: '美国', JP: '日本', SG: '新加坡', TW: '台湾',
    CN: '中国大陆', DE: '德国', GB: '英国', NL: '荷兰', AU: '澳大利亚',
    KR: '韩国',
    CA: '加拿大', FR: '法国', RU: '俄罗斯', IN: '印度', TH: '泰国',
    MY: '马来西亚', PH: '菲律宾', VN: '越南', ID: '印度尼西亚',
    NZ: '新西兰', CH: '瑞士', SE: '瑞典', NO: '挪威', FI: '芬兰',
    DK: '丹麦', IT: '意大利', ES: '西班牙', PL: '波兰', TR: '土耳其',
    AE: '阿联酋', BR: '巴西', MO: '澳门',
});

function token(value) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^A-Z0-9])${escaped}(?:[^A-Z0-9]|$)`, 'iu');
}

const KEYWORD_RULES = Object.freeze([
    ['HK', /香港|HONG\s*KONG|HONGKONG|九龙|九龍|KOWLOON|新界|沙田|荃湾|荃灣|葵涌/iu],
    ['US', /美国|美國|UNITED\s*STATES|AMERICA|LOS\s*ANGELES|NEW\s*YORK|SEATTLE|SAN\s*JOSE/iu],
    ['JP', /日本|JAPAN|东京|東京|大阪|TOKYO|OSAKA/iu],
    ['SG', /新加坡|狮城|獅城|SINGAPORE/iu],
    ['TW', /[台臺][湾灣]|TAIWAN|TAIPEI|台北|臺北|新北|彰化/iu],
    ['DE', /德国|德國|GERMANY|FRANKFURT/iu],
    ['GB', /英国|英國|UNITED\s*KINGDOM|ENGLAND|LONDON|MANCHESTER/iu],
    ['NL', /荷兰|荷蘭|NETHERLANDS|AMSTERDAM/iu],
    ['AU', /澳大利亚|澳大利亞|澳洲|AUSTRALIA|SYDNEY|MELBOURNE/iu],
    ['KR', /韩国|韓國|南韩|南韓|KOREA|SEOUL/iu],
    ['CA', /加拿大|CANADA|TORONTO|VANCOUVER/iu],
    ['FR', /法国|法國|FRANCE|PARIS/iu],
    ['RU', /俄罗斯|俄羅斯|RUSSIA|MOSCOW/iu],
    ['ID', /印度尼西亚|印度尼西亞|印尼|INDONESIA|JAKARTA/iu],
    ['IN', /印度|INDIA|DELHI|MUMBAI/iu],
    ['TH', /泰国|泰國|THAILAND|BANGKOK/iu],
    ['MY', /马来西亚|馬來西亞|MALAYSIA|KUALA\s*LUMPUR/iu],
    ['PH', /菲律宾|菲律賓|PHILIPPINES|MANILA/iu],
    ['VN', /越南|VIETNAM|HANOI|HO\s*CHI\s*MINH/iu],
    ['NZ', /新西兰|新西蘭|纽西兰|紐西蘭|NEW\s*ZEALAND|AUCKLAND/iu],
    ['CH', /瑞士|SWITZERLAND|ZURICH/iu],
    ['IT', /意大利|義大利|ITALY|ROME|MILAN/iu],
    ['ES', /西班牙|SPAIN|MADRID|BARCELONA/iu],
    ['TR', /土耳其|TURKEY|TÜRKIYE|ISTANBUL/iu],
    ['AE', /阿联酋|阿聯酋|UNITED\s*ARAB\s*EMIRATES|DUBAI/iu],
    ['BR', /巴西|BRAZIL|SÃO\s*PAULO|SAO\s*PAULO/iu],
    ['MO', /澳门|澳門|MACAU|MACAO/iu],
    ['CN', /中国大陆|中國大陸|大陆|大陸|中国|中國|CHINA|MAINLAND/iu],
]);

const CODE_ALIASES = Object.freeze({
    HK: ['HK', 'HKG'],
    US: [
        'US', 'USA', 'LAX', 'SFO', 'SEA', 'JFK', 'EWR', 'IAD', 'ATL', 'ORD',
        'MIA', 'NYC', 'DFW', 'SJC',
    ],
    JP: ['JP', 'JPN', 'NRT', 'HND', 'KIX', 'TYO', 'OSA'],
    SG: ['SG', 'SIN'],
    TW: ['TW', 'TWN', 'TPE', 'ROC'],
    DE: ['DE', 'DEU', 'FRA'],
    GB: ['GB', 'UK', 'GBR', 'LHR', 'LGW', 'EDI'],
    NL: ['NL', 'NLD', 'AMS'],
    AU: ['AU', 'AUS', 'SYD', 'MEL'],
    KR: ['KR', 'KOR', 'ICN', 'GMP'],
    CA: ['CA', 'CAN', 'YYZ', 'YVR'],
    FR: ['FR', 'CDG', 'ORY'],
    RU: ['RU', 'RUS', 'SVO'],
    IN: ['IN', 'IND', 'DEL', 'BOM'],
    TH: ['TH', 'BKK'],
    MY: ['MY', 'KUL'],
    PH: ['PH', 'MNL'],
    VN: ['VN', 'HAN', 'SGN'],
    ID: ['ID', 'CGK'],
    NZ: ['NZ', 'AKL'],
    CH: ['CH', 'CHE', 'ZRH'],
    IT: ['IT', 'ITA', 'FCO', 'MXP'],
    ES: ['ES', 'ESP', 'MAD', 'BCN'],
    TR: ['TR', 'TUR', 'IST'],
    AE: ['AE', 'UAE', 'ARE', 'DXB'],
    BR: ['BR', 'BRA', 'GRU'],
    MO: ['MO', 'MFM'],
    CN: ['CN', 'CHN'],
});

const SHORT_CODE_RULES = Object.freeze(
    Object.entries(CODE_ALIASES).flatMap(([key, aliases]) =>
        aliases.map((alias) => [key, token(alias)])),
);

const SHORTHAND_RULES = Object.freeze([
    ['HK', /(?:^|[\s|_-])港(?:[\s|_#-]*\d+|$)/u],
    ['US', /(?:^|[\s|_-])美(?:[\s|_#-]*\d+|$)/u],
    ['JP', /(?:^|[\s|_-])日(?:[\s|_#-]*\d+|$)/u],
    ['SG', /(?:^|[\s|_-])坡(?:[\s|_#-]*\d+|$)/u],
    ['TW', /(?:^|[\s|_-])台(?:[\s|_#-]*\d+|$)/u],
    ['GB', /(?:^|[\s|_-])英(?:[\s|_#-]*\d+|$)/u],
]);

const PRIVATE_NODE_TOKEN = /(?:^|[^A-Z0-9])(?:ctm|private|prime)(?=$|[^A-Z0-9])/iu;

function normalizeNodeName(value) {
    return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function codeToFlag(key) {
    return Array.from(key, (letter) =>
        String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join('');
}

function flagToRegionKey(name) {
    const match = normalizeNodeName(name).match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
    if (!match) return null;
    return Array.from(match[0], (flag) =>
        String.fromCharCode(65 + flag.codePointAt(0) - 0x1f1e6)).join('');
}

function classifyNodeNameByText(normalized) {
    for (const [key, pattern] of KEYWORD_RULES) {
        if (pattern.test(normalized)) return key;
    }
    for (const [key, pattern] of SHORTHAND_RULES) {
        if (pattern.test(normalized)) return key;
    }
    for (const [key, pattern] of SHORT_CODE_RULES) {
        if (pattern.test(normalized)) return key;
    }
    return null;
}

function classifyChineseRegionByText(normalized) {
    const ruleSets = [KEYWORD_RULES, SHORTHAND_RULES, SHORT_CODE_RULES];
    for (const regionKey of CHINESE_REGION_PRIORITY) {
        for (const rules of ruleSets) {
            for (const [key, pattern] of rules) {
                if (key === regionKey && pattern.test(normalized)) return regionKey;
            }
        }
    }
    return null;
}

function classifyNodeName(name) {
    const normalized = normalizeNodeName(name);
    const flagKey = flagToRegionKey(normalized);
    if (flagKey && !CHINESE_REGION_KEYS.has(flagKey)) return flagKey;
    const chineseRegionKey = classifyChineseRegionByText(normalized);
    if (chineseRegionKey) return chineseRegionKey;
    if (flagKey) return flagKey;
    return classifyNodeNameByText(normalized) || 'OTHER';
}

function regionGroupName(key) {
    if (key === 'OTHER') return '🌐 其他地区';
    if (key === 'TW') return '🇹🇼 TW 台湾节点';
    return `${codeToFlag(key)} ${REGION_NAMES[key] || key}节点`;
}

function bucketProxies(proxies) {
    const buckets = new Map();
    for (const item of proxies) {
        const key = classifyNodeName(item.name);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(item.name);
    }
    return buckets;
}

function orderedRegionKeys(buckets) {
    const keys = [...buckets.keys()].filter((key) => key !== 'OTHER');
    const preferredIndex = new Map(
        PREFERRED_REGION_ORDER.map((key, index) => [key, index]),
    );
    keys.sort((left, right) => {
        const leftIndex = preferredIndex.has(left) ? preferredIndex.get(left) : Infinity;
        const rightIndex = preferredIndex.has(right) ? preferredIndex.get(right) : Infinity;
        if (leftIndex !== rightIndex) return leftIndex - rightIndex;
        return left.localeCompare(right, 'en');
    });
    if (buckets.has('OTHER')) keys.push('OTHER');
    return keys;
}

function createUrlTestGroup(name, proxies) {
    return {
        name,
        type: 'url-test',
        url: 'https://cp.cloudflare.com/generate_204',
        interval: 300,
        tolerance: 50,
        proxies,
    };
}

function isPrivateNodeName(name) {
    return PRIVATE_NODE_TOKEN.test(normalizeNodeName(name));
}

function buildRegionGroups(proxies) {
    const buckets = bucketProxies(proxies);
    const groups = orderedRegionKeys(buckets).map((key) => createUrlTestGroup(
        regionGroupName(key),
        [...buckets.get(key)],
    ));
    const privateProxies = proxies
        .filter((item) => isPrivateNodeName(item.name))
        .map((item) => item.name);
    if (privateProxies.length > 0) {
        groups.push(createUrlTestGroup(PRIVATE_GROUP, privateProxies));
    }
    return groups;
}

const LEGACY_REGION_KEYS = new Map([
    ['🇭🇰 香港节点', 'HK'], ['🇺🇸 美国节点', 'US'], ['🇯🇵 日本节点', 'JP'],
    ['🇸🇬 新加坡节点', 'SG'], ['🇼🇸 台湾节点', 'TW'], ['🇹🇼 台湾节点', 'TW'],
    ['TW 台湾节点', 'TW'], ['🇰🇷 韩国节点', 'KR'],
    ['🇩🇪 德国节点', 'DE'], ['🇬🇧 英国节点', 'GB'], ['🇳🇱 荷兰节点', 'NL'],
    ['🇦🇺 澳大利亚节点', 'AU'],
]);

function managedRegionKey(name) {
    if (LEGACY_REGION_KEYS.has(name)) return LEGACY_REGION_KEYS.get(name);
    if (name === PRIVATE_GROUP) return PRIVATE_GROUP_KEY;
    if (name === '🌐 其他地区') return 'OTHER';
    if (/^[\u{1F1E6}-\u{1F1FF}]{2}\s+.+节点$/u.test(name)) {
        return flagToRegionKey(name);
    }
    return null;
}

function isManagedRegionGroup(group) {
    if (!group || typeof group.name !== 'string') return false;
    if (group.name === PRIVATE_GROUP) return group.type === 'url-test';
    if (LEGACY_REGION_KEYS.has(group.name)) return true;
    return /^(?:[\u{1F1E6}-\u{1F1FF}]{2}\s+.+节点|🌐 其他地区)$/u.test(group.name)
        && group.type === 'url-test';
}

function unique(values) {
    return [...new Set(values)];
}

function replaceRegionReferences(original, oldRegionSet, replacements) {
    const output = [];
    let inserted = false;
    for (const candidate of original) {
        if (oldRegionSet.has(candidate)) {
            if (!inserted) output.push(...replacements);
            inserted = true;
        } else {
            output.push(candidate);
        }
    }
    if (!inserted) output.push(...replacements);
    return unique(output);
}

function stripManagedUse(group) {
    const originalUse = Array.isArray(group.use) ? group.use : [];
    const hadManagedUse = originalUse.includes(MANAGED_PROVIDER);
    const remainingUse = originalUse.filter((name) => name !== MANAGED_PROVIDER);
    if (remainingUse.length > 0) group.use = remainingUse;
    else delete group.use;
    return { hadManagedUse };
}

function fallbackCandidates(groupName, knownGroupNames) {
    return [MANUAL_GROUP, 'DIRECT'].filter((candidate) =>
        candidate !== groupName
        && (BUILTIN_OUTBOUNDS.has(candidate) || knownGroupNames.has(candidate)));
}

function rewriteRuleTargets(rules, replacements) {
    if (!Array.isArray(rules)) return rules;
    return rules.map((rule) => {
        if (typeof rule !== 'string') return rule;
        const fields = rule.split(',');
        if (fields.length < 2) return rule;
        const lastIndex = fields.length - 1;
        const targetIndex = fields[lastIndex].trim() === 'no-resolve'
            ? lastIndex - 1
            : lastIndex;
        if (targetIndex < 0) return rule;
        const replacement = replacements.get(fields[targetIndex].trim());
        if (!replacement) return rule;
        fields[targetIndex] = replacement;
        return fields.join(',');
    });
}

function rewriteProxyGroups(config) {
    const originalGroups = Array.isArray(config['proxy-groups'])
        ? config['proxy-groups']
        : [];
    const managedGroups = originalGroups.filter(isManagedRegionGroup);
    const managedNames = managedGroups.map((group) => group.name);
    const managedKeys = unique(managedNames.map(managedRegionKey).filter(Boolean));
    const managedSet = new Set(managedNames);
    const firstManagedIndex = originalGroups.findIndex(isManagedRegionGroup);
    const generatedGroups = buildRegionGroups(config.proxies);
    const activeNames = generatedGroups.map((group) => group.name);
    const hasPrivateGroup = activeNames.includes(PRIVATE_GROUP);
    const activeNameByKey = new Map(
        generatedGroups.map((group) => [managedRegionKey(group.name), group.name]),
    );
    const retainedGroups = originalGroups.filter((group) => !isManagedRegionGroup(group));
    const knownGroupNames = new Set([
        ...retainedGroups.map((group) => group.name),
        ...activeNames,
    ]);
    const ruleFallback = knownGroupNames.has(MANUAL_GROUP) ? MANUAL_GROUP : 'DIRECT';
    const ruleTargetReplacements = new Map(
        managedGroups.map(({ name }) => {
            const key = managedRegionKey(name);
            return [name, activeNameByKey.get(key) || ruleFallback];
        }),
    );

    for (const current of retainedGroups) {
        const originalProxies = Array.isArray(current.proxies) ? current.proxies : [];
        const originalRegionRefs = originalProxies.filter((name) => managedSet.has(name));
        const originalRegionKeys = unique(
            originalRegionRefs.map(managedRegionKey).filter(Boolean),
        );
        const referencedEveryManagedRegion = managedKeys.length > 0
            && managedKeys.every((key) => originalRegionKeys.includes(key));
        const { hadManagedUse } = stripManagedUse(current);

        if (current.name === MANUAL_GROUP) {
            const preservedGroupCandidates = originalProxies.filter((candidate) =>
                candidate !== current.name
                && !managedSet.has(candidate)
                && (knownGroupNames.has(candidate) || BUILTIN_OUTBOUNDS.has(candidate)),
            );
            current.proxies = unique([...preservedGroupCandidates, ...activeNames]);
            continue;
        }

        let replacements = originalRegionKeys
            .map((key) => activeNameByKey.get(key))
            .filter(Boolean);
        if (referencedEveryManagedRegion) replacements = activeNames;
        if (originalRegionRefs.length > 0) {
            current.proxies = replaceRegionReferences(
                originalProxies,
                managedSet,
                replacements,
            );
        } else if (hadManagedUse && current.type === 'url-test') {
            current.proxies = config.proxies.map((item) => item.name);
        } else if (hadManagedUse) {
            current.proxies = unique([...originalProxies, ...activeNames]);
        } else if (Array.isArray(current.proxies)) {
            current.proxies = unique(originalProxies);
        }

        const candidates = Array.isArray(current.proxies)
            ? current.proxies.filter((candidate) => candidate !== current.name)
            : [];
        if (candidates.length === 0 && !Array.isArray(current.use)) {
            current.proxies = fallbackCandidates(current.name, knownGroupNames).slice(0, 1);
        } else if (Array.isArray(current.proxies)) {
            current.proxies = candidates;
        }
        if (hasPrivateGroup
            && current.type === 'select'
            && current.name !== DIRECT_GROUP
            && Array.isArray(current.proxies)) {
            current.proxies = unique([...current.proxies, PRIVATE_GROUP]);
        }
    }

    const directIndex = retainedGroups.findIndex((group) => group.name === DIRECT_GROUP);
    const insertionIndex = firstManagedIndex >= 0
        ? Math.min(firstManagedIndex, retainedGroups.length)
        : directIndex >= 0 ? directIndex : retainedGroups.length;
    retainedGroups.splice(insertionIndex, 0, ...generatedGroups);
    config['proxy-groups'] = retainedGroups;
    config.rules = rewriteRuleTargets(config.rules, ruleTargetReplacements);
}

function removeManagedProvider(config) {
    const providers = config['proxy-providers'];
    if (!providers || typeof providers !== 'object' || Array.isArray(providers)) return;
    delete providers[MANAGED_PROVIDER];
    if (Object.keys(providers).length === 0) delete config['proxy-providers'];
}

const CANDIDATE_GROUP_TYPES = new Set([
    'select', 'url-test', 'fallback', 'load-balance', 'relay', 'smart',
]);

function validateInput(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        throw new Error('config must be an object');
    }
    if (!Array.isArray(config.proxies) || config.proxies.length === 0) {
        throw new Error('config.proxies must contain at least one proxy');
    }
    const names = new Set();
    for (const item of config.proxies) {
        if (!item || typeof item.name !== 'string' || item.name.trim() === '') {
            throw new Error('every proxy must have a non-empty string name');
        }
        if (names.has(item.name)) throw new Error(`duplicate proxy name: ${item.name}`);
        names.add(item.name);
    }
}

function ruleTarget(rule) {
    if (typeof rule !== 'string') return null;
    const fields = rule.split(',').map((field) => field.trim());
    if (fields.length < 2) return null;
    const last = fields[fields.length - 1];
    if (last === 'no-resolve') return fields[fields.length - 2] || null;
    return last;
}

function validateConfig(config) {
    const proxies = Array.isArray(config.proxies) ? config.proxies : [];
    const groups = Array.isArray(config['proxy-groups']) ? config['proxy-groups'] : [];
    const proxyNames = new Set(proxies.map((item) => item.name));
    for (const name of proxyNames) {
        if (BUILTIN_OUTBOUNDS.has(name)) {
            throw new Error(`proxy name conflicts with reserved outbound: ${name}`);
        }
    }
    const groupNames = new Set();
    for (const current of groups) {
        if (!current || typeof current.name !== 'string' || current.name.trim() === '') {
            throw new Error('every proxy group must have a non-empty string name');
        }
        if (groupNames.has(current.name)) {
            throw new Error(`duplicate proxy group name: ${current.name}`);
        }
        if (BUILTIN_OUTBOUNDS.has(current.name)) {
            throw new Error(`proxy group name conflicts with reserved outbound: ${current.name}`);
        }
        if (proxyNames.has(current.name)) {
            throw new Error(`proxy and proxy group share name: ${current.name}`);
        }
        groupNames.add(current.name);
    }

    const providerNames = new Set(Object.keys(config['proxy-providers'] || {}));
    for (const current of groups) {
        const candidates = Array.isArray(current.proxies) ? current.proxies : [];
        const uses = Array.isArray(current.use) ? current.use : [];
        for (const candidate of candidates) {
            if (!proxyNames.has(candidate)
                && !groupNames.has(candidate)
                && !BUILTIN_OUTBOUNDS.has(candidate)) {
                throw new Error(`${current.name} has unknown candidate: ${candidate}`);
            }
        }
        for (const provider of uses) {
            if (!providerNames.has(provider)) {
                throw new Error(`${current.name} uses unknown provider: ${provider}`);
            }
        }
        const includesImplicitCandidates = current['include-all'] === true
            || current['include-all-proxies'] === true
            || current['include-all-providers'] === true;
        if (CANDIDATE_GROUP_TYPES.has(current.type)
            && candidates.length === 0
            && uses.length === 0
            && !includesImplicitCandidates) {
            throw new Error(`${current.name} has no candidates`);
        }
    }

    for (const rule of Array.isArray(config.rules) ? config.rules : []) {
        const target = ruleTarget(rule);
        if (target
            && !proxyNames.has(target)
            && !groupNames.has(target)
            && !BUILTIN_OUTBOUNDS.has(target)) {
            throw new Error(`unknown rule target: ${target}`);
        }
    }
}

function transformConfig(input) {
    validateInput(input);
    validateConfig(input);
    const output = JSON.parse(JSON.stringify(input));
    rewriteProxyGroups(output);
    removeManagedProvider(output);
    validateConfig(output);
    return output;
}

async function main(config) {
    return transformConfig(config);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        bucketProxies,
        buildRegionGroups,
        classifyNodeName,
        flagToRegionKey,
        isManagedRegionGroup,
        main,
        normalizeNodeName,
        orderedRegionKeys,
        regionGroupName,
        removeManagedProvider,
        rewriteProxyGroups,
        transformConfig,
        validateConfig,
        validateInput,
    };
}
