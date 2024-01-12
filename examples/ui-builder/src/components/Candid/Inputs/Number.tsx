import { cn } from "../../../utils"
import { useFormContext } from "react-hook-form"
import { RouteProps } from "../Route"
import LabelEditor from "../../FormBuilder/LabelEditor"

export interface NumberProps extends RouteProps<"number"> {}

const Number: React.FC<NumberProps> = ({
  registerName,
  errors,
  extractedField,
}) => {
  const { register, resetField, trigger } = useFormContext()

  const resetHandler = () => {
    resetField(registerName as never)
    trigger(registerName as never, { shouldFocus: true })
  }

  const errorMessage = errors?.message?.toString()

  return (
    <div className="w-full p-1">
      <LabelEditor registerName={registerName} label={extractedField.label} />
      {/* <label htmlFor={registerName} className="block">
        {extractedField.label}
        {extractedField.required && <span className="text-red-500">*</span>}
        {errorMessage && (
          <span className="text-red-500 text-xs ml-1">( {errorMessage} )</span>
        )}
      </label> */}
      <div className="relative">
        <input
          id={registerName}
          {...register(`data.${registerName}`, {
            ...extractedField,
            shouldUnregister: true,
          })}
          className={cn(
            "w-full h-8 pl-2 pr-8 border rounded",
            !!errors ? "border-red-500" : "border-gray-300"
          )}
          type="number"
          placeholder="number"
        />
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center w-8 text-red-500 pb-1 px-1 cursor-pointer"
          onClick={resetHandler}
        >
          <span className="text-2xl leading-5 font-bold">×</span>
        </div>
      </div>
    </div>
  )
}

export default Number
