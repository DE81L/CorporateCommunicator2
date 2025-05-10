"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WikiPlaceholder;
const react_i18next_1 = require("react-i18next");
function WikiPlaceholder() {
    const { t } = (0, react_i18next_1.useTranslation)();
    return (<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">📚 Wiki</h1>
        <p className="text-gray-600">
          This feature is temporarily unavailable.
        </p>
      </div>
    </div>);
}
