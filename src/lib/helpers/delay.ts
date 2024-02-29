import React, {useEffect, useState} from 'react'

function delay(func: () => any) {
	const [state, setState] = useState<boolean>(false)

	useEffect(() => {
		func()
	}, [state])

	return () => {
		setState((value) => !value)
	}
}

export default delay
