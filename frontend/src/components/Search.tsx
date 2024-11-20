import Select from 'react-select'
import { grayDark } from "@radix-ui/colors";

const options = [
  { value: 'creeper', label: 'Creeper' },
  { value: 'zombie', label: 'Zombie' },
  { value: 'skeleton', label: 'Skeleton' },
  { value: 'enderman', label: 'Enderman' },
  { value: 'spider', label: 'Spider' },
  { value: 'pig', label: 'Pig' },
  { value: 'cow', label: 'Cow' },
  { value: 'chicken', label: 'Chicken' }
]

const Search = () => {
  return (
    <div style={{ width: "100%" }}>
      <Select
        options={options}
        className="basic-multi-select"
        isMulti
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: grayDark.gray3,
            borderColor: grayDark.gray8,
            borderRadius: "max(var(--radius-2), var(--radius-full))",
            color: grayDark.gray11,
            "&:hover": {
              borderColor: grayDark.gray10,
            },
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: grayDark.gray4,
            borderRadius: "max(var(--radius-2), var(--radius-full))",
            boxShadow: "var(--shadow-3)"
          }),
          option: (baseStyles, state) => ({
            ...baseStyles,
            borderRadius: "max(var(--radius-2), var(--radius-full))",
            backgroundColor: state.isFocused
              ? grayDark.gray8
              : grayDark.gray4,
            "&:hover": {
              backgroundColor: grayDark.gray8
            },
          }),
          multiValue: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: grayDark.gray8,
            borderRadius: "max(var(--radius-2), var(--radius-full))",
          }),
          multiValueLabel: (baseStyles) => ({
            ...baseStyles,
            color: grayDark.gray12
          }),
          multiValueRemove: (baseStyles) => ({
            ...baseStyles,
            borderRadius: "max(var(--radius-2), var(--radius-full))",
            "&:hover": {
              backgroundColor: grayDark.gray9,
              color: grayDark.gray12,
              cursor: "pointer"
            },
          }),
          input: (baseStyles) => ({
            ...baseStyles,
            color: grayDark.gray12,
          })
        }} />
    </div>
  )
}

export default Search;