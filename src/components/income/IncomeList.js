// src/components/income/IncomeList.js
import IncomeCard from './IncomeCard';

export default function IncomeList({ incomeSources }) {
    if (!incomeSources || incomeSources.length === 0) {
        return (
            <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-600 rounded-lg mt-6">
                <p className="text-lg">No income sources tracked yet.</p>
                <p className="mt-1">Click "Add Income" to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {incomeSources.map((income) => (
                income && income.id ? <IncomeCard key={income.id} income={income} /> : null
            ))}
        </div>
    );
}