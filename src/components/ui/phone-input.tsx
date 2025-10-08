import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const COUNTRY_CODES = [
  { code: "+963", country: "Syria", flag: "🇸🇾", minLength: 9, maxLength: 9 },
  { code: "+971", country: "UAE", flag: "🇦🇪", minLength: 9, maxLength: 9 },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", minLength: 9, maxLength: 9 },
  { code: "+20", country: "Egypt", flag: "🇪🇬", minLength: 10, maxLength: 10 },
  { code: "+90", country: "Turkey", flag: "🇹🇷", minLength: 10, maxLength: 10 },
  { code: "+962", country: "Jordan", flag: "🇯🇴", minLength: 9, maxLength: 9 },
  { code: "+961", country: "Lebanon", flag: "🇱🇧", minLength: 8, maxLength: 8 },
  { code: "+964", country: "Iraq", flag: "🇮🇶", minLength: 10, maxLength: 10 },
  { code: "+49", country: "Germany", flag: "🇩🇪", minLength: 10, maxLength: 11 },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸", minLength: 10, maxLength: 10 },
  { code: "+44", country: "UK", flag: "🇬🇧", minLength: 10, maxLength: 10 },
]

export interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  error?: string
}

export const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ value = "", onChange, className, placeholder, disabled, error }, ref) => {
    const [countryCode, setCountryCode] = React.useState("+963")
    const [phoneNumber, setPhoneNumber] = React.useState("")

    React.useEffect(() => {
      // Parse existing value if provided
      if (value && value.startsWith('+')) {
        const matchedCode = COUNTRY_CODES.find(c => value.startsWith(c.code))
        if (matchedCode) {
          setCountryCode(matchedCode.code)
          setPhoneNumber(value.slice(matchedCode.code.length))
        }
      }
    }, [])

    React.useEffect(() => {
      // Notify parent of changes
      if (onChange) {
        onChange(countryCode + phoneNumber)
      }
    }, [countryCode, phoneNumber])

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow numbers
      const cleaned = e.target.value.replace(/\D/g, '')
      const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode)
      
      // Limit length based on country
      if (selectedCountry && cleaned.length <= selectedCountry.maxLength) {
        setPhoneNumber(cleaned)
      }
    }

    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode)
    const isValidLength = selectedCountry && 
      phoneNumber.length >= selectedCountry.minLength && 
      phoneNumber.length <= selectedCountry.maxLength

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <div className="flex gap-2">
          <Select value={countryCode} onValueChange={setCountryCode} disabled={disabled}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span>{COUNTRY_CODES.find(c => c.code === countryCode)?.flag}</span>
                  <span>{countryCode}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.code} {country.country}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 relative">
            <Input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder={placeholder || selectedCountry?.minLength.toString().padEnd(selectedCountry?.minLength, 'X')}
              disabled={disabled}
              className={cn(
                error && "border-destructive",
                phoneNumber && !isValidLength && "border-yellow-500"
              )}
              dir="ltr"
            />
          </div>
        </div>
        {phoneNumber && !isValidLength && (
          <p className="text-xs text-yellow-600">
            Phone number should be {selectedCountry?.minLength}-{selectedCountry?.maxLength} digits for {selectedCountry?.country}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"
