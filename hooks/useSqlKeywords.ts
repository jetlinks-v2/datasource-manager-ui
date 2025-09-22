const commonTips = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'OUTER',
  'LEFT',
  'RIGHT',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'DISTINCT',
  'AS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'NULL',
  'NOT',
  'AND',
  'OR',
  'IS',
  'BETWEEN',
  'LIKE',
  'IN',
  'EXISTS',
  'ALL',
  'ANY',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'CREATE',
  'ALTER',
  'DROP',
  'TABLE',
  'VIEW',
  'INDEX',
  'DATABASE',
  'PROCEDURE',
  'FUNCTION',
  'TRIGGER',
  'CONSTRAINT',
  'PRIMARY',
  'FOREIGN',
  'KEY',
  'REFERENCES',
  'DEFAULT',
  'AUTO_INCREMENT',
  'UNIQUE',
  'CHECK',
  'CASCADE',
  'SET'
]

const registrationTips = {
  name: 'sql',
  suggestions: commonTips.map((item) => {
    return {
      label: item,
      insertText: item,
      kind: 18
    }
  })
}

export const useSqlKeywords = () => {
  const generateTableSuggestions = (tablesData: any) => {
    const nameSet: Set<string> = new Set()

    tablesData.forEach((table: any) => {
      // 添加表名
      nameSet.add(table.name)

      // 添加列名
      table.columns.forEach((column: any) => {
        nameSet.add(column.name)
      })
    })

    // 将 Set 转为数组，并生成 suggestions
    return Array.from(nameSet).map((item: string) => ({
      label: item,
      insertText: item,
      kind: 18
    }))
  }

  const getTableSuggestions = (tablesData: any) => {
    const generate = generateTableSuggestions(tablesData)
    const newSuggestions = {
      ...registrationTips,
      suggestions: [...registrationTips.suggestions, ...generate]
    }
    return newSuggestions
  }

  return {
    getTableSuggestions
  }
}
