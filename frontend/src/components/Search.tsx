import Select, { MultiValue } from 'react-select'
import { grayDark } from "@radix-ui/colors";
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Search = (props: {
  options: { value: string, label: string }[],
  setSelectedEntities: (entities: string[]) => void
}) => {
  const location = useLocation()

  const [localValue, setLocalValue] = useState<{ value: string, label: string }[]>([])

  const handleEntityInputChange = (selected: MultiValue<{
    value: string;
    label: string;
  }>) => {
    setLocalValue(selected as unknown as any)
    props.setSelectedEntities(selected.map((value) => value.value))
  }

  useEffect(() => {
    if (location.pathname == '/') {
      setLocalValue([])
      return
    } else if (location.pathname != '/search-detail')
      return;

    setLocalValue((location.state?.currentEntities || []).map((x: string) => ({ value: x, label: x })))
  }, [location.pathname])


  return (
    <div style={{ width: "100%" }}>
      <Select
        options={props.options}
        className="basic-multi-select"
        isMulti
        value={localValue}
        onChange={handleEntityInputChange}
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
            boxShadow: "var(--shadow-3)",
            zIndex: 3
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