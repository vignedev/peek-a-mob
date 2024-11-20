import Select from 'react-select'
import {grayDark, whiteA} from "@radix-ui/colors";

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' }
]

const Search = () => {
    return (
        <Select 
            options={options} 
            className="basic-multi-select"
            isMulti
            styles={{
                control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: grayDark.gray3,
                    borderColor: grayDark.gray8,
                    borderRadius: 30,
                    color: grayDark.gray11,
                }),
                menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: grayDark.gray4,
                    borderRadius: 16
                }),
                option: (baseStyles, state) => ({
                    ...baseStyles,
                    borderRadius: 16,
                    backgroundColor: state.isFocused
                        ? grayDark.gray8
                        : grayDark.gray4,
                    "&:hover": {
                        backgroundColor: grayDark.gray8
                    },
                }),
                singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: "red",
                    backgroundColor: "blue"
                }),
                multiValue: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: grayDark.gray8,
                    borderRadius: 16,
                    
                }),
                multiValueLabel: (baseStyles) => ({
                    ...baseStyles,
                    color: "red"
                }),
                multiValueRemove: (baseStyles) => ({
                    ...baseStyles,
                    borderRadius: 16
                }),
                
        }}/>
    )
}

export default Search;