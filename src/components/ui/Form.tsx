"use client";
import { cn } from "@/lib/utils";
import { ChangeEvent, ReactNode } from "react";

const baseField =
  "w-full bg-white border border-slate-200 rounded-2xl px-4 h-12 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-950/[0.02] focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition";

export function Label({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-sm font-medium text-slate-700">
        {children}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

export function FormInput({
  label,
  required,
  hint,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  type?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      {label && (
        <Label required={required} hint={hint}>
          {label}
        </Label>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={baseField}
      />
    </div>
  );
}

export function FormTextarea({
  label,
  required,
  hint,
  name,
  placeholder,
  rows = 4,
  value,
  onChange,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  name?: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      {label && (
        <Label required={required} hint={hint}>
          {label}
        </Label>
      )}
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={cn(baseField, "h-auto min-h-32 py-3 leading-relaxed resize-y")}
      />
    </div>
  );
}

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FormSelectProps = {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: SelectOption[];
  required?: boolean;
  hint?: string;
};

export function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
  hint,
}: FormSelectProps) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </Label>

      {hint && <p className="mb-1 text-xs text-slate-500">{hint}</p>}

      <select
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  required,
}: {
  label: string;
  name?: string;
  checked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        aria-required={required}
        className="w-4 h-4 rounded text-brand-500 border-slate-300 focus:ring-brand-300"
      />
      <span>
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
    </label>
  );
}
