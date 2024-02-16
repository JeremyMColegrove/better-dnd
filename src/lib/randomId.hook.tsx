import {useState} from 'react'

function useRandomID() {
	const [id] = useState<string>(crypto.randomUUID())
	return id
}

export default useRandomID
