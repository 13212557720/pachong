export interface FetchIpLocationParams {
  targetUserId: string;
  cookie?: string;
}

interface BloksLocationItem {
  data?: {
    initial?: unknown;
  };
}

interface BloksLocationPayload {
  payload?: {
    layout?: {
      bloks_payload?: {
        data?: BloksLocationItem[];
      };
    };
  };
}

/**
 * 获取指定用户的 Instagram IP 属地
 * 
 * @param params 包含目标用户的 ID 和用于请求的 cookie
 * @returns 目标用户的 IP 属地字符串（例如 "墨西哥"），如果获取失败则返回 null
 */
export async function fetchInstagramIpLocation(params: FetchIpLocationParams): Promise<string | null> {
  const { targetUserId, cookie } = params;

  // 默认请求体，基于测试脚本提取
  const baseBody = "__d=www&__user=0&__a=1&__req=1a&__hs=20579.HYP%3Ainstagram_web_pkg.2.1...0&dpr=1&__ccg=UNKNOWN&__rev=1038847115&__s=xvl0nq%3Aij1ut5%3A1cnjfh&__hsi=7636695670340758073&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJxS0DU2wx609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C1uwoE2swlo8od8-U2zxe2GewGw9a3614xm1Wxfxm16wUwtE1wEbUGdG1QwTU9UaQ0Lo6-bwHwKG1pg2fwxyo6O1FwlAcwBwUQp6x6Ub8jK5V89F8uwm8jxK1mwa6bBK4o16UeUG3a18whE984O0XEdo&__csr=gJb7gR247QrTFNAQjiliSxP5YZinlZfROamtyfAzajCyGiS-yquVFq-vQa-ABuqidhaUy9GF8B5DQjAmby8mzq8KhLiKtRQcQqnmimAF5yueJpkHLABCAAh8yq5LhqiipipqGVHAVuaDhUziGdx6WBUymuayqG5VkRipoO4V4GZ2ucGqVknV8Px53t3K224qxm5pZopggGdy8Cu69podUG0RogwfWE04G207fE0Be07m8037RwWwWw5SxOu2m05--0O87y9K6U32xe0etwnE1B-2Wu0LU4h073w6ChEx09Ew9jatyVAE5d0vo2qBG1Dxm1Aw896y834BsgEjz40UEbUKfxOl0k8O0lG0Eo921GaBsgVm9wmkm1FwKCx0Md61rwno0QK4982A7Jr7wee01lww0PCxd0&__hsdp=gp4Og8O142kYQIdgB59QB2Bd8zEOQzmWsnnR5hQTpOZijtotW9M-gbCBPmiam4Qc6a8w8GqhyOebAwmoohoy5U4R0hoUwKCpwKwzwOjia9wjV8iUcA6oK6Uhxy3ml2E98fo8vy8dU13qwgEdFo4O6odUWUO1bg7O0chwywhE2fw3p825wKw4bw28k0bqw_w4axXwl81co3zzo1Joqw29U0L20yUS0pq16wAxi15wx83q1twca1Gw9W&__hblp=4wOw9y5e7E98aUyUhD_yUnwAxSiUgwxxa4obEmxR0Lz9oKaJ0xyV87edAu8wQwGhojGeAxat1iuExCwyAzu4UbUpwSxxe4Km9wyh8kyaxDVoCi4UjxGql2EK68fp8Wmv-q3u0zohDwWG2uEbokgdpo42bxB0OKeKcwiQ1wxK8U7q0Ho1pU7C2a16wPwxwCxa0aAwjU6-0xobE12U1GXqxS1eg0JG3-fwko2EyEjU5iu1twr9k5oowExS0RU1IoqwaO1Ow47w5tw4xg6-0yUS1kwro4y3C4Uf84q2i9yk262e5oIwdE5S0yEdu1GxTwvE&__sjsp=gp4Og8O142kYQIdgB59QB48lji8WcJ8RKD5RZhktcS8hl82KgD3VVhNFsR5yBxd31w2tAwwwtQ0hq&__comet_req=7&fb_dtsg=NAftJ1rpmMQh_FTUZK3eQ-_vGtCh_R4oVTDVrCCn14cCONUcaHQu09A%3A17864863018060157%3A1777020715&jazoest=26116&lsd=0yBlcjCh4N55pz-r53vi5T&__spin_r=1038847115&__spin_b=trunk&__spin_t=1778056768&__crn=comet.igweb.PolarisProfilePostsTabRoute&params=%7B%22referer_type%22%3A%22ProfileUsername%22%2C%22target_user_id%22%3A%22373686400%22%7D";
  
  // 替换 target_user_id 参数
  const body = baseBody.replace(/%22target_user_id%22%3A%22\d+%22/, `%22target_user_id%22%3A%22${targetUserId}%22`);

  try {
    const res = await fetch("https://www.instagram.com/async/wbloks/fetch/?appid=com.bloks.www.ig.about_this_account&type=app&__bkv=ad0f1f5e41c2d9fcde83dfd68eea4def768b66bc3029c58e846d7c1dda44ba2a", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-prefers-color-scheme": "light",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": cookie || "",
      },
      body,
      // 禁用缓存
      cache: "no-store",
    });

    const text = await res.text();
    // 剔除防被调用的 for (;;); 前缀
    const jsonText = text.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, "");
    
    const data = JSON.parse(jsonText) as BloksLocationPayload;

    let location: string | null = null;
    const items = data.payload?.layout?.bloks_payload?.data ?? [];
    for (const item of items) {
      if (item?.data?.initial && typeof item.data.initial === "string") {
        location = item.data.initial;
        // 有些初始数据可能不是地区而是用户名等，这里需要确认规则
        // 根据测试结果，返回的通常是类似于 "墨西哥" 这样的字符串，或者更长的文本。
        // 一般来说属地通常在第一个或者只返回一个字符串
        break;
      }
    }

    return location;
  } catch (error) {
    console.error("fetchInstagramIpLocation failed:", error);
    return null;
  }
}
