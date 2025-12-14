import { useEffect, useState } from "react";

interface IUseFetch {
    method: 'POST' | 'GET' | 'PATCH' | 'PUT';
    body?: Record<string, string>;
    token?: string;
    url: string;
}

export const useFetch = ({ method, body, url, token }: IUseFetch) => {
    const [apiData, setApiData] = useState<any | null>(null);
    const [loading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(url, {
                    method,
                    body: body ? JSON.stringify(body) : "",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? 'Bearer ${}' : "",
                    }
                });
                if (!res.ok) {
                    setMessage("Something went wrong");
                    return null;
                }
                const data = await res.json();
                setApiData(data);
                setMessage(data?.message);

            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                    console.log(error);
                }
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [url]);

    return [apiData, loading, error, message];

}