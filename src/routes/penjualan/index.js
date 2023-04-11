import clientPromise from '$lib/db'
//import { v4 as uuid } from 'uuid'

export async function get(request) {
	try {
		const client = await clientPromise
		const db = client.db('abadipos')
		const collection = db.collection('dataMenu')
		const tes = await collection.find().toArray()

		return {
			status: 200,
			body: {
				tes
			}
		}
	} catch (err) {
		console.log(err)
		return {
			status: 500,
			body: {
				error: 'An error occured'
			}
		}
	}
}
