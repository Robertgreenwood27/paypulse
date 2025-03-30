// src/components/bills/BillList.js
import BillCard from './BillCard'; // Make sure BillCard is in the same directory

export default function BillList({ bills }) {
    if (!bills || bills.length === 0) {
        return (
            <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-600 rounded-lg mt-6">
                <p className="text-lg">No bills tracked yet.</p>
                <p className="mt-1">Click "Add Bill" to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {/* Filter out any potentially null/invalid bill objects */}
            {bills.filter(bill => bill && bill.id).map((bill) => (
                <BillCard key={bill.id} bill={bill} />
            ))}
        </div>
    );
}