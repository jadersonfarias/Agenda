import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
    ...nextVitals,
    {
        rules: {
            'react-hooks/error-boundaries': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
        },
    },
    {
        ignores: ['tsconfig.tsbuildinfo'],
    },
]

export default eslintConfig
