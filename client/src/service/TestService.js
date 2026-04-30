import axios from 'axios';

export default class TestService {
    getTests() {
        return axios.get('/api/tests')
            .then((res) => res.data)
            .then((data) => data || []);
    }

    saveTest(test) {
        return axios.post('/api/tests', test, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => res.data);
    }

    deleteTest(id) {
        return axios.delete(`/api/tests/${id}`);
    }
}