import {useState} from 'react'

// I extracted this as a hook in case we want to change the way internal ID's are generated in the future
function useRandomID() {
	const [id] = useState<string>(crypto.randomUUID())
	return id
}

export default useRandomID
