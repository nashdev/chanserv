module.exports = {
  globals: {
    "ts-jest": {
      tsConfigFile: "tsconfig.json"
    }
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  testMatch: ["**/__tests__/**/*.test.(ts|js)"],
  testPathIgnorePatterns: ["node_modules", "dist"],
  modulePathIgnorePatterns: ["dist"],
  testEnvironment: "node"
};
