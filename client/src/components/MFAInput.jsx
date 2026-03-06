import { useRef, useState } from 'react';

export default function MFAInput({ length = 6, onComplete }) {
    const [values, setValues] = useState(Array(length).fill(''));
    const inputRefs = useRef([]);

    const handleChange = (index, e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (!val) return;

        const newValues = [...values];
        newValues[index] = val[val.length - 1];
        setValues(newValues);

        // Auto-focus next
        if (index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check completion
        const code = newValues.join('');
        if (code.length === length && !newValues.includes('')) {
            onComplete?.(code);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            const newValues = [...values];
            if (values[index]) {
                newValues[index] = '';
                setValues(newValues);
            } else if (index > 0) {
                newValues[index - 1] = '';
                setValues(newValues);
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        const newValues = [...values];
        pasted.split('').forEach((char, i) => {
            newValues[i] = char;
        });
        setValues(newValues);
        const nextEmpty = newValues.findIndex((v) => !v);
        inputRefs.current[nextEmpty >= 0 ? nextEmpty : length - 1]?.focus();

        if (!newValues.includes('')) {
            onComplete?.(newValues.join(''));
        }
    };

    return (
        <div className="flex gap-2 justify-between">
            {values.map((val, i) => (
                <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] shrink-0 text-center text-lg font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900
                     focus:bg-white focus:ring-2 focus:ring-[#e8f0fe] focus:border-primary outline-none transition-all leading-none"
                    aria-label={`MFA digit ${i + 1}`}
                />
            ))}
        </div>
    );
}
