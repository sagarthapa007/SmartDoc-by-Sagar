import { UniversalPatternDetector } from "./UniversalPatternDetector.js";
import { PersonalFinanceAnalyzer } from "./domains/PersonalFinanceAnalyzer.js";
import { HealthAnalyzer } from "./domains/HealthAnalyzer.js";
import { AcademicAnalyzer } from "./domains/AcademicAnalyzer.js";
import { HRPayrollAnalyzer } from "./domains/HRPayrollAnalyzer.js";
import { InventoryAnalyzer } from "./domains/InventoryAnalyzer.js";
import { FinanceAnalyzer } from "./domains/FinanceAnalyzer.js";
import { GenericAnalyzer } from "./domains/GenericAnalyzer.js";

export class AnalysisRouter {
  static route(data, overrideDomain = null) {
    const context = UniversalPatternDetector.analyze(data);
    if (overrideDomain) context.domain = overrideDomain;
    const result = (() => {
      switch (context.domain) {
        case "personal_finance":
          return PersonalFinanceAnalyzer.analyzeDomain(data, context);
        case "finance":
          return FinanceAnalyzer.analyzeDomain(data, context);
        case "inventory":
          return InventoryAnalyzer.analyzeDomain(data, context);
        case "hr":
          return HRPayrollAnalyzer.analyzeDomain(data, context);
        case "health":
          return HealthAnalyzer.analyzeDomain(data, context);
        case "academic":
          return AcademicAnalyzer.analyzeDomain(data, context);
        case "business_sales":
          return FinanceAnalyzer.analyzeDomain(data, context);
        default:
          return GenericAnalyzer.analyzeDomain(data, context);
      }
    })();
    return { context, ...result };
  }
}
