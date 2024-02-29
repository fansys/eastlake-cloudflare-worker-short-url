import { useState, useEffect } from "react";
import axios from "axios";
import { shorten, list, del } from "./api/workersapi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import ShortUrlList from "./components/ShortUrlList";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const baseURL = publicRuntimeConfig.CLOUDFLARE_WORKER_BASE_URL;

export default function Shorten() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrlLength, setShortUrlLength] = useState(10);
  const [expirationTime, setExpirationTime] = useState(0);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [reloadShortUrls, setReloadShortUrls] = useState(false);

  const [jwt, setJwt] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [advancedSettings, setAdvancedSettings] = useState(false);
  const [advancedSettingsVisible, setAdvancedSettingsVisible] = useState(false);
  const [shortUrls, setShortUrls] = useState([]);
  const [oldShortUrl, setOldShortUrl] = useState("");
  function handleCopyClick() {
    navigator.clipboard.writeText(`${baseURL}/${shortUrl}`);
  }

  useEffect(() => {
    const jwtCookie = document.cookie
      .split(";")
      .map((cookie) => cookie.trim()) // Add this line to trim each cookie string
      .find((cookie) => cookie.startsWith("jwt="));

    console.log(`document.cookie in /shorten page is:${document.cookie}`);
    console.log(`jwtCookie in /shorten page is:${jwtCookie}`);

    if (jwtCookie) {
      const jwt = jwtCookie.split("=")[1];
      setJwt(jwt);
      // Load short URLs
      const loadShortUrls = async () => {
        const response = await list({ jwt });
        setShortUrls(response);
      };
      loadShortUrls();
    } else {
      window.location.href = "/index";
    }
  }, [reloadShortUrls]); // Only run once on component mount

  function isValidUrl(url) {
    const pattern = new RegExp("^https?:\\/\\/"); // match http:// or https:// at the beginning
    return !!url.match(pattern);
  }

  const handleShortenRequest = async (event) => {
    event.preventDefault();
    setInfo("");
    setError("");
    const trimmedUrl = longUrl.trim(); // trim the longUrl

    // Validate parameters
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      setError("请输入长链接");

      return;
    }
    if (shortUrlLength < 1 || shortUrlLength > 10) {
      setError("链接长度需在1-10之间");
      return;
    }
    if (expirationTime < 0 || expirationTime > 1440) {
      setError("过期时间需在0-1440之间");
      return;
    }

    // Check if password is required and has been entered
    if (requirePassword && !password.trim()) {
      setError("访问密码未设置");
      return;
    }

    const response = await shorten({
      longUrl: trimmedUrl,
      shortUrlLength,
      expirationTime,
      requirePassword,
      password,
      jwt,
      oldShortUrl,
      shortUrl,
      id,
    });
    console.log(`Response:${JSON.stringify(response)}`);
    if (response.status === 200) {
      setShortUrl(response.shortUrl);
      setOldShortUrl(response.shortUrl);
      setInfo(
        `Url ${trimmedUrl} has been shorten to ${baseURL}/${response.shortUrl}`
      );
      setLongUrl(response.longUrl);
      setShortUrlLength(response.shortUrlLength);
      // setExpirationTime(response.expirationTime);
      setRequirePassword(response.requirePassword);
      setPassword(response.password);
      setId(response.id);
      setReloadShortUrls((prev) => !prev);
    } else {
      setError("Server Error");
    }
  };

  const toggleAdvancedSettings = () => {
    setAdvancedSettings(!advancedSettings);
  };

  return (
    <div className="pt-8 pb-8 flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {error && (
        <div className="my-4 p-2 rounded-lg bg-red-100 text-red-800">
          {error}
        </div>
      )}
      {info && (
        <div className="my-4 p-2 rounded-lg bg-green-100 text-green-800">
          {info}
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-700  mb-8">Shorten a URL</h1>
      <form
        className="w-full max-w-lg p-4 bg-white rounded-lg shadow-md"
        onSubmit={handleShortenRequest}
      >
        <div className="mb-4">
          <label
            htmlFor="longUrl"
            className="block text-gray-700 font-bold mb-2"
          >
            原始链接
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              name="longUrl"
              id="longUrl"
              className="shadow appearance-none border rounded-lg w-full py-4 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={longUrl}
              onChange={(event) => {
                setLongUrl(event.target.value);
                setShortUrl("");
                setInfo("");
                setError("");
              }}
              style={{ borderRadius: "20px" }}
              required
            />
            <button
              type="submit"
              className="absolute right-1 mr-3 py-3 text-blue-500"
            >
              <FontAwesomeIcon icon={faPaperPlane} size="2x" />
            </button>
          </div>
        </div>
        {longUrl && shortUrl ? (
          <div className="mb-4">
            <label
              htmlFor="shortUrl"
              className="block text-gray-700 font-bold mb-2"
            >
              短链接
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                name="domain"
                id="domain"
                className="shadow appearance-none border rounded-l-lg w-2/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={baseURL + "/"}
                readOnly
              />
              <input
                type="text"
                name="shortUrl"
                id="shortUrl"
                className="shadow appearance-none border w-1/3 rounded-r-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={shortUrl}
                onChange={(event) => {
                  setShortUrl(event.target.value);
                }}
              />
              <button
                type="button"
                className="absolute right-0 mr-2 text-black"
                onClick={handleCopyClick}
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="relative mb-4">
          <a
            href="#"
            className="text-blue-500 hover:underline"
            onClick={(event) => {
              event.preventDefault();
              setAdvancedSettingsVisible(!advancedSettingsVisible);
            }}
          >
            {advancedSettingsVisible ? "隐藏" : "高级选项"}
          </a>
          {advancedSettingsVisible && (
            <div className="pl-8">
              <div className="relative mb-4">
                <label
                  htmlFor="shortUrlLength"
                  className="block text-gray-700 font-bold mb-2"
                >
                  链接长度
                </label>
                <input
                  type="number"
                  name="shortUrlLength"
                  id="shortUrlLength"
                  min="1"
                  max="10"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={shortUrlLength}
                  onChange={(event) =>
                    setShortUrlLength(parseInt(event.target.value))
                  }
                  required
                />
              </div>
              <div className="mb-4">
                <input
                  type="checkbox"
                  name="requirePassword"
                  id="requirePassword"
                  className="mr-2 leading-tight"
                  checked={requirePassword}
                  onChange={(event) => setRequirePassword(event.target.checked)}
                />
                <label htmlFor="requirePassword" className="text-gray-700">
                  访问密码
                </label>
              </div>
              {requirePassword && (
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-gray-700 font-bold mb-2"
                  >
                    密码
                  </label>
                  <input
                    type="text"
                    name="password"
                    id="password"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              )}
              <div className="mb-4">
                <label
                  htmlFor="expirationTime"
                  className="block text-gray-700 font-bold mb-2"
                >
                  过期时间
                </label>
                <input
                  type="number"
                  name="expirationTime"
                  id="expirationTime"
                  min={0}
                  max={1440}
                  step={1}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={expirationTime}
                  onChange={(event) =>
                    setExpirationTime(parseInt(event.target.value))
                  }
                />
                <span className="text-gray-500 ml-2">
                  分钟 (0 用不过期)
                </span>
              </div>
            </div>
          )}
        </div>
      </form>
      <ShortUrlList
        shortUrls={shortUrls}
        setReloadShortUrls={setReloadShortUrls}
      />
    </div>
  );
}
