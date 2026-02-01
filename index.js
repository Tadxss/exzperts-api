// const axios = require('axios');

// const getCorsHeaders = () => ({
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
//   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
//   'Access-Control-Max-Age': '86400',
//   'Content-Type': 'application/json'
// });

// /**
//  * Fetch records from Tadabase using REST API with filters
//  */
// async function fetchTadabaseRecords(tableName, apiKey, appId, appSecret, filterConfig = null) {
//   try {
//     const url = `https://api.tadabase.io/api/v1/data-tables/${tableName}/records`;
    
//     const headers = {
//       'X-Tadabase-App-id': appId,
//       'X-Tadabase-App-Key': apiKey
//     };
    
//     if (appSecret) {
//       headers['X-Tadabase-App-Secret'] = appSecret;
//     }
    
//     const params = {};
    
//     // Add filters if provided
//     if (filterConfig) {
//       params['filters[items][0][field_id]'] = filterConfig.field_id;
//       params['filters[items][0][operator]'] = filterConfig.operator;
//       params['filters[items][0][val]'] = filterConfig.val;
//     }
    
//     console.log('Fetching records with params:', params);
    
//     const response = await axios.get(url, {
//       headers: headers,
//       params: params
//     });
    
//     return response.data.items || [];
//   } catch (error) {
//     console.error('Tadabase API Error:', error.response?.data || error.message);
//     throw new Error(`Failed to fetch from Tadabase: ${error.message}`);
//   }
// }

// /**
//  * Fetch a single record from Tadabase
//  */
// async function fetchTadabaseRecord(tableName, recordId, apiKey, appId, appSecret) {
//   try {
//     const url = `https://api.tadabase.io/api/v1/data-tables/${tableName}/records/${recordId}`;
    
//     const headers = {
//       'X-Tadabase-App-id': appId,
//       'X-Tadabase-App-Key': apiKey
//     };
    
//     if (appSecret) {
//       headers['X-Tadabase-App-Secret'] = appSecret;
//     }
    
//     const response = await axios.get(url, { headers });
    
//     // Return the item, not the wrapper object
//     return response.data.item || null;
//   } catch (error) {
//     console.error('Tadabase API Error fetching record:', error.response?.data || error.message);
//     return null;
//   }
// }

// /**
//  * Main logic: Filter bid requests based on blacklist AND expert type matching
//  */
// async function filterBidRequests(params) {
//   try {
//     const { 
//       loggedInUserId, 
//       apiKey, 
//       appId,
//       appSecret,
//       bidRequestTableId,
//       usersTableId,
//       injuryCategoriesTableId,
//       openStatusId
//     } = params;
//     // Validate required parameters
//     if (!loggedInUserId) {
//       throw new Error('Missing required parameter: loggedInUserId');
//     }
    
//     if (!apiKey || !appId || !bidRequestTableId || !usersTableId || !injuryCategoriesTableId) {
//       throw new Error('Missing Tadabase configuration. Check environment variables.');
//     }
//     console.log('Fetching OPEN bid requests for user:', loggedInUserId);
//     console.log('Open Status ID:', openStatusId);
    
//     // Step 1: Fetch the logged-in user's expert types
//     const userData = await fetchTadabaseRecord(usersTableId, loggedInUserId, apiKey, appId, appSecret);
    
//     if (!userData) {
//       throw new Error('Could not fetch user data');
//     }
    
//     // field_560 is the Expert Types connection field in Users table
//     const userExpertTypes = userData.field_560 || [];
//     console.log('User expert types:', userExpertTypes);
    
//     // Step 2: Build filter for Open status only
//     const filterConfig = {
//       field_id: 'field_314',
//       operator: 'is',
//       val: openStatusId
//     };
    
//     // Fetch only OPEN bid requests using Tadabase API filter
//     const openBidRequests = await fetchTadabaseRecords(bidRequestTableId, apiKey, appId, appSecret, filterConfig);
    
//     console.log(`Found ${openBidRequests.length} OPEN bid requests from API`);
//     // Step 3: Collect all unique injury category IDs from all bid requests
//     const allInjuryCategoryIds = new Set();
//     openBidRequests.forEach(bidRequest => {
//       const injuryCategories = bidRequest.field_537 || [];
//       injuryCategories.forEach(id => allInjuryCategoryIds.add(id));
//     });
    
//     console.log(`Fetching ${allInjuryCategoryIds.size} unique injury categories...`);
    
//     // Step 4: Fetch all injury categories in parallel
//     const injuryCategoryPromises = Array.from(allInjuryCategoryIds).map(id => 
//       fetchTadabaseRecord(injuryCategoriesTableId, id, apiKey, appId, appSecret)
//     );
    
//     const injuryCategories = await Promise.all(injuryCategoryPromises);
    
//     // Create a map of injury category ID to expert types for quick lookup
//     const injuryCategoryExpertTypesMap = {};
//     injuryCategories.forEach((category, index) => {
//       if (category) {
//         const categoryId = Array.from(allInjuryCategoryIds)[index];
//         injuryCategoryExpertTypesMap[categoryId] = category.field_534 || [];
//       }
//     });
    
//     console.log('Injury category expert types map:', injuryCategoryExpertTypesMap);
//     // Step 5: Collect all unique lawyer IDs
//     const allLawyerIds = new Set();
//     openBidRequests.forEach(bidRequest => {
//       const lawyerField = bidRequest.field_319;
//       if (lawyerField && lawyerField.length > 0) {
//         const lawyerId = Array.isArray(lawyerField) ? lawyerField[0] : lawyerField;
//         allLawyerIds.add(lawyerId);
//       }
//     });
    
//     console.log(`Fetching ${allLawyerIds.size} unique lawyers...`);
    
//     // Step 6: Fetch all lawyers in parallel
//     const lawyerPromises = Array.from(allLawyerIds).map(id => 
//       fetchTadabaseRecord(usersTableId, id, apiKey, appId, appSecret)
//     );
    
//     const lawyers = await Promise.all(lawyerPromises);
    
//     // Create a map of lawyer ID to blacklist for quick lookup
//     const lawyerBlacklistMap = {};
//     lawyers.forEach((lawyer, index) => {
//       if (lawyer) {
//         const lawyerId = Array.from(allLawyerIds)[index];
//         lawyerBlacklistMap[lawyerId] = lawyer.field_570 || [];
//       }
//     });
    
//     console.log('Lawyer blacklist map:', lawyerBlacklistMap);
//     // Step 7: Filter bid requests using the cached data
//     const filteredBidRequests = [];
//     let blacklistedCount = 0;
//     let expertTypeMismatchCount = 0;
    
//     for (const bidRequest of openBidRequests) {
//       // Check 1: Blacklist filter
//       const lawyerField = bidRequest.field_319;
      
//       if (lawyerField && lawyerField.length > 0) {
//         const lawyerId = Array.isArray(lawyerField) ? lawyerField[0] : lawyerField;
//         const lawyerBlacklist = lawyerBlacklistMap[lawyerId] || [];
        
//         const isBlacklisted = Array.isArray(lawyerBlacklist) 
//           ? lawyerBlacklist.includes(loggedInUserId)
//           : lawyerBlacklist === loggedInUserId;
//         if (isBlacklisted) {
//           console.log(`❌ Bid request ${bidRequest.id} - user is blacklisted by lawyer ${lawyerId}`);
//           blacklistedCount++;
//           continue; // Skip this bid request
//         }
//       }
      
//       // Check 2: Expert Type matching
//       const bidRequestInjuryCategories = bidRequest.field_537 || [];
      
//       if (bidRequestInjuryCategories.length > 0 && userExpertTypes.length > 0) {
//         let hasMatchingExpertType = false;
        
//         for (const injuryCategoryId of bidRequestInjuryCategories) {
//           const injuryExpertTypes = injuryCategoryExpertTypesMap[injuryCategoryId] || [];
          
//           // Check if there's any overlap between user's expert types and injury's expert types
//           const hasOverlap = userExpertTypes.some(userType => injuryExpertTypes.includes(userType));
          
//           if (hasOverlap) {
//             hasMatchingExpertType = true;
//             console.log(`✅ Bid request ${bidRequest.id} - matched expert type via injury ${injuryCategoryId}`);
//             break;
//           }
//         }
        
//         if (!hasMatchingExpertType) {
//           console.log(`❌ Bid request ${bidRequest.id} - no matching expert types`);
//           expertTypeMismatchCount++;
//           continue; // Skip this bid request
//         }
//       }
      
//       // Passed both filters
//       console.log(`✅ Bid request ${bidRequest.id} - passed all filters`);
//            filteredBidRequests.push(bidRequest);
//     }
//     return {
//       status: 'success',
//       openBidRequests: openBidRequests.length,
//       filteredBidRequests: filteredBidRequests.length,
//       removedByBlacklist: blacklistedCount,
//       removedByExpertType: expertTypeMismatchCount,
//       totalRemoved: blacklistedCount + expertTypeMismatchCount,
//       data: filteredBidRequests,
//       timestamp: new Date().toISOString()
//     };
//   } catch (err) {
//     console.error('Filter error:', err);
//     throw new Error('Failed to filter bid requests: ' + err.message);
//   }
// }

// /**
//  * AWS Lambda Handler
//  */
// exports.handler = async (event) => {
//   console.log('Received event:', JSON.stringify(event, null, 2));
  
//   const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod || 'POST';
  
//   console.log('HTTP Method:', httpMethod);
  
//   // Handle CORS preflight
//   if (httpMethod === 'OPTIONS') {
//     return {
//       statusCode: 200,
//       headers: getCorsHeaders(),
//       body: JSON.stringify({ message: 'CORS preflight' })
//     };
//   }

//   try {
//     let params = {};
    
//     // Parse parameters from query string or body
//     if (event.queryStringParameters) {
//       params = { ...event.queryStringParameters };
//     }
//     if (event.body) {
//       const bodyParams = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
//       params = { ...params, ...bodyParams };
//     }

//     // Clean up user ID (remove curly braces if present)
//     if (params.loggedInUserId && typeof params.loggedInUserId === 'string') {
//       params.loggedInUserId = params.loggedInUserId.replace(/[{}]/g, '').trim();
//       console.log('Cleaned user ID:', params.loggedInUserId);
//     }

//     // Get credentials from environment variables (never from request body)
//     params.apiKey = process.env.TADABASE_API_KEY;
//     params.appId = process.env.TADABASE_APP_ID;
//     params.appSecret = process.env.TADABASE_APP_SECRET;
//     params.bidRequestTableId = process.env.BID_REQUEST_TABLE_ID;
//     params.usersTableId = process.env.USERS_TABLE_ID;
//     params.injuryCategoriesTableId = process.env.INJURY_CATEGORIES_TABLE_ID;
//     params.openStatusId = process.env.OPEN_STATUS_ID || 'eykNOvrDY3';
    
//     const result = await filterBidRequests(params);
    
//     return {
//       statusCode: 200,
//       headers: getCorsHeaders(),
//       body: JSON.stringify(result)
//     };

//   } catch (error) {
//     console.error('Handler error:', error);
//     return {
//       statusCode: error.statusCode || 500,
//       headers: getCorsHeaders(),
//       body: JSON.stringify({
//         status: 'failed',
//         message: error.message || 'Action failed',
//         error: error.toString(),
//       })
//     };
//   }
// };


const axios = require('axios');

const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
});

/**
 * Fetch records from Tadabase using REST API with filters
 */
async function fetchTadabaseRecords(tableName, apiKey, appId, appSecret, filterConfig = null) {
  try {
    const url = `https://api.tadabase.io/api/v1/data-tables/${tableName}/records`;
    
    const headers = {
      'X-Tadabase-App-id': appId,
      'X-Tadabase-App-Key': apiKey
    };
    
    if (appSecret) {
      headers['X-Tadabase-App-Secret'] = appSecret;
    }
    
    const params = {};
    
    // Add filters if provided
    if (filterConfig) {
      params['filters[items][0][field_id]'] = filterConfig.field_id;
      params['filters[items][0][operator]'] = filterConfig.operator;
      params['filters[items][0][val]'] = filterConfig.val;
    }
    
    console.log('Fetching records with params:', params);
    
    const response = await axios.get(url, {
      headers: headers,
      params: params
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error('Tadabase API Error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch from Tadabase: ${error.message}`);
  }
}

/**
 * Fetch a single record from Tadabase
 */
async function fetchTadabaseRecord(tableName, recordId, apiKey, appId, appSecret) {
  try {
    const url = `https://api.tadabase.io/api/v1/data-tables/${tableName}/records/${recordId}`;
    
    const headers = {
      'X-Tadabase-App-id': appId,
      'X-Tadabase-App-Key': apiKey
    };
    
    if (appSecret) {
      headers['X-Tadabase-App-Secret'] = appSecret;
    }
    
    const response = await axios.get(url, { headers });
    
    // Return the item, not the wrapper object
    return response.data.item || null;
  } catch (error) {
    console.error('Tadabase API Error fetching record:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main logic: Filter bid requests based on blacklist, expert type, AND plaintiff age
 */
async function filterBidRequests(params) {
  try {
    const { 
      loggedInUserId, 
      apiKey, 
      appId,
      appSecret,
      bidRequestTableId,
      usersTableId,
      injuryCategoriesTableId,
      bidRequestDetailsTableId,
      claimsTableId,
      plaintiffsTableId,
      openStatusId
    } = params;

    // Validate required parameters
    if (!loggedInUserId) {
      throw new Error('Missing required parameter: loggedInUserId');
    }
    
    if (!apiKey || !appId || !bidRequestTableId || !usersTableId || !injuryCategoriesTableId || !bidRequestDetailsTableId || !claimsTableId || !plaintiffsTableId) {
      throw new Error('Missing Tadabase configuration. Check environment variables.');
    }

    console.log('Fetching OPEN bid requests for user:', loggedInUserId);
    console.log('Open Status ID:', openStatusId);
    
    // Step 1: Fetch the logged-in user's data
    const userData = await fetchTadabaseRecord(usersTableId, loggedInUserId, apiKey, appId, appSecret);
    
    if (!userData) {
      throw new Error('Could not fetch user data');
    }
    
    // field_560 is the Expert Types connection field in Users table
    const userExpertTypes = userData.field_560 || [];
    console.log('User expert types:', userExpertTypes);
    
    // field_566 is Min Age, field_567 is Max Age
    const userMinAge = userData.field_566;
    const userMaxAge = userData.field_567;
    console.log('User age range:', userMinAge, '-', userMaxAge);
    
    // Determine if we should apply age filter
    const shouldApplyAgeFilter = (userMinAge !== null && userMinAge !== undefined && userMinAge !== '') || 
                                  (userMaxAge !== null && userMaxAge !== undefined && userMaxAge !== '');
    console.log('Should apply age filter:', shouldApplyAgeFilter);
    
    // Step 2: Build filter for Open status only
    const filterConfig = {
      field_id: 'field_314',
      operator: 'is',
      val: openStatusId
    };
    
    // Fetch only OPEN bid requests using Tadabase API filter
    const openBidRequests = await fetchTadabaseRecords(bidRequestTableId, apiKey, appId, appSecret, filterConfig);
    
    console.log(`Found ${openBidRequests.length} OPEN bid requests from API`);

    // Step 3: Collect all unique injury category IDs from all bid requests
    const allInjuryCategoryIds = new Set();
    openBidRequests.forEach(bidRequest => {
      const injuryCategories = bidRequest.field_537 || [];
      injuryCategories.forEach(id => allInjuryCategoryIds.add(id));
    });
    
    console.log(`Fetching ${allInjuryCategoryIds.size} unique injury categories...`);
    
    // Step 4: Fetch all injury categories in parallel
    const injuryCategoryPromises = Array.from(allInjuryCategoryIds).map(id => 
      fetchTadabaseRecord(injuryCategoriesTableId, id, apiKey, appId, appSecret)
    );
    
    const injuryCategories = await Promise.all(injuryCategoryPromises);
    
    // Create a map of injury category ID to expert types for quick lookup
    const injuryCategoryExpertTypesMap = {};
    injuryCategories.forEach((category, index) => {
      if (category) {
        const categoryId = Array.from(allInjuryCategoryIds)[index];
        injuryCategoryExpertTypesMap[categoryId] = category.field_534 || [];
      }
    });

    // Step 5: Collect all unique lawyer IDs
    const allLawyerIds = new Set();
    openBidRequests.forEach(bidRequest => {
      const lawyerField = bidRequest.field_319;
      if (lawyerField && lawyerField.length > 0) {
        const lawyerId = Array.isArray(lawyerField) ? lawyerField[0] : lawyerField;
        allLawyerIds.add(lawyerId);
      }
    });
    
    console.log(`Fetching ${allLawyerIds.size} unique lawyers...`);
    
    // Step 6: Fetch all lawyers in parallel
    const lawyerPromises = Array.from(allLawyerIds).map(id => 
      fetchTadabaseRecord(usersTableId, id, apiKey, appId, appSecret)
    );
    
    const lawyers = await Promise.all(lawyerPromises);
    
    // Create a map of lawyer ID to blacklist for quick lookup
    const lawyerBlacklistMap = {};
    lawyers.forEach((lawyer, index) => {
      if (lawyer) {
        const lawyerId = Array.from(allLawyerIds)[index];
        lawyerBlacklistMap[lawyerId] = lawyer.field_570 || [];
      }
    });

    // Step 7: If age filter is enabled, fetch bid request details, claims, and plaintiffs
    let bidRequestPlaintiffsMap = {};
    
    if (shouldApplyAgeFilter && bidRequestDetailsTableId && claimsTableId && plaintiffsTableId) {
      console.log('Fetching bid request details for age filtering...');
      
      // Fetch all bid request details
      const allBidRequestDetails = await fetchTadabaseRecords(bidRequestDetailsTableId, apiKey, appId, appSecret);
      
      // Create map: bid request ID -> bid request detail ID
      const bidRequestToDetailMap = {};
      allBidRequestDetails.forEach(detail => {
        const bidRequestIds = detail.field_496 || []; // Connection to Bid Request
        bidRequestIds.forEach(bidRequestId => {
          bidRequestToDetailMap[bidRequestId] = detail.id;
        });
      });
      
      // Collect all claim IDs from bid request details
      const allClaimIds = new Set();
      allBidRequestDetails.forEach(detail => {
        const claimIds = detail.field_500 || []; // Connection to Claims
        claimIds.forEach(id => allClaimIds.add(id));
      });
      
      console.log(`Fetching ${allClaimIds.size} unique claims...`);
      
      // Fetch all claims in parallel
      const claimPromises = Array.from(allClaimIds).map(id => 
        fetchTadabaseRecord(claimsTableId, id, apiKey, appId, appSecret)
      );
      
      const claims = await Promise.all(claimPromises);
      
      // Collect all plaintiff IDs from claims
      const allPlaintiffIds = new Set();
      const claimToPlaintiffsMap = {};
      
      claims.forEach((claim, index) => {
        if (claim) {
          const claimId = Array.from(allClaimIds)[index];
          const plaintiffIds = claim.field_204 || []; // Connection to Plaintiffs
          claimToPlaintiffsMap[claimId] = plaintiffIds;
          plaintiffIds.forEach(id => allPlaintiffIds.add(id));
        }
      });
      
      console.log(`Fetching ${allPlaintiffIds.size} unique plaintiffs...`);
      
      // Fetch all plaintiffs in parallel
      const plaintiffPromises = Array.from(allPlaintiffIds).map(id => 
        fetchTadabaseRecord(plaintiffsTableId, id, apiKey, appId, appSecret)
      );
      
      const plaintiffs = await Promise.all(plaintiffPromises);
      
      // Create map: plaintiff ID -> age
      const plaintiffAgeMap = {};
      plaintiffs.forEach((plaintiff, index) => {
        if (plaintiff) {
          const plaintiffId = Array.from(allPlaintiffIds)[index];
          plaintiffAgeMap[plaintiffId] = plaintiff.field_195; // Age field
        }
      });
      
      // Build map: bid request ID -> all plaintiff ages
      bidRequestPlaintiffsMap = {};
      
      openBidRequests.forEach(bidRequest => {
        const bidRequestDetailId = bidRequestToDetailMap[bidRequest.id];
        
        if (bidRequestDetailId) {
          const detail = allBidRequestDetails.find(d => d.id === bidRequestDetailId);
          
          if (detail) {
            const claimIds = detail.field_500 || [];
            const plaintiffAges = [];
            
            claimIds.forEach(claimId => {
              const plaintiffIds = claimToPlaintiffsMap[claimId] || [];
              plaintiffIds.forEach(plaintiffId => {
                const age = plaintiffAgeMap[plaintiffId];
                if (age !== null && age !== undefined && age !== '') {
                  plaintiffAges.push(parseFloat(age));
                }
              });
            });
            
            bidRequestPlaintiffsMap[bidRequest.id] = plaintiffAges;
          }
        }
      });
      
      console.log('Bid request plaintiffs map:', bidRequestPlaintiffsMap);
    }

    // Step 8: Filter bid requests using all criteria
    const filteredBidRequests = [];
    let blacklistedCount = 0;
    let expertTypeMismatchCount = 0;
    let ageMismatchCount = 0;
    
    for (const bidRequest of openBidRequests) {
      // Check 1: Blacklist filter
      const lawyerField = bidRequest.field_319;
      
      if (lawyerField && lawyerField.length > 0) {
        const lawyerId = Array.isArray(lawyerField) ? lawyerField[0] : lawyerField;
        const lawyerBlacklist = lawyerBlacklistMap[lawyerId] || [];
        
        const isBlacklisted = Array.isArray(lawyerBlacklist) 
          ? lawyerBlacklist.includes(loggedInUserId)
          : lawyerBlacklist === loggedInUserId;

        if (isBlacklisted) {
          console.log(`❌ Bid request ${bidRequest.id} - user is blacklisted by lawyer ${lawyerId}`);
          blacklistedCount++;
          continue;
        }
      }
      
      // Check 2: Expert Type matching
      const bidRequestInjuryCategories = bidRequest.field_537 || [];
      
      if (bidRequestInjuryCategories.length > 0 && userExpertTypes.length > 0) {
        let hasMatchingExpertType = false;
        
        for (const injuryCategoryId of bidRequestInjuryCategories) {
          const injuryExpertTypes = injuryCategoryExpertTypesMap[injuryCategoryId] || [];
          const hasOverlap = userExpertTypes.some(userType => injuryExpertTypes.includes(userType));
          
          if (hasOverlap) {
            hasMatchingExpertType = true;
            break;
          }
        }
        
        if (!hasMatchingExpertType) {
          console.log(`❌ Bid request ${bidRequest.id} - no matching expert types`);
          expertTypeMismatchCount++;
          continue;
        }
      }
      
      // Check 3: Plaintiff age filter (only if user has min/max age set)
      if (shouldApplyAgeFilter) {
        const plaintiffAges = bidRequestPlaintiffsMap[bidRequest.id] || [];
        
        if (plaintiffAges.length > 0) {
          let allAgesMatch = true;
          
          for (const age of plaintiffAges) {
            let ageMatches = true;
            
            // Check min age
            if (userMinAge !== null && userMinAge !== undefined && userMinAge !== '') {
              const minAge = parseFloat(userMinAge);
              if (age < minAge) {
                ageMatches = false;
                console.log(`Age ${age} is below min age ${minAge}`);
              }
            }
            
            // Check max age
            if (userMaxAge !== null && userMaxAge !== undefined && userMaxAge !== '') {
              const maxAge = parseFloat(userMaxAge);
              if (age > maxAge) {
                ageMatches = false;
                console.log(`Age ${age} is above max age ${maxAge}`);
              }
            }
            
            if (!ageMatches) {
              allAgesMatch = false;
              break;
            }
          }
          
          if (!allAgesMatch) {
            console.log(`❌ Bid request ${bidRequest.id} - plaintiff ages ${plaintiffAges.join(', ')} don't match user age range ${userMinAge}-${userMaxAge}`);
            ageMismatchCount++;
            continue;
          }
        }
      }
      
      // Passed all filters
      console.log(`✅ Bid request ${bidRequest.id} - passed all filters`);
      filteredBidRequests.push(bidRequest);
    }

    return {
      status: 'success',
      openBidRequests: openBidRequests.length,
      filteredBidRequests: filteredBidRequests.length,
      removedByBlacklist: blacklistedCount,
      removedByExpertType: expertTypeMismatchCount,
      removedByAge: ageMismatchCount,
      totalRemoved: blacklistedCount + expertTypeMismatchCount + ageMismatchCount,
      data: filteredBidRequests,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error('Filter error:', err);
    throw new Error('Failed to filter bid requests: ' + err.message);
  }
}

/**
 * AWS Lambda Handler
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod || 'POST';
  
  console.log('HTTP Method:', httpMethod);
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  try {
    let params = {};
    
    // Parse parameters from query string or body
    if (event.queryStringParameters) {
      params = { ...event.queryStringParameters };
    }
    if (event.body) {
      const bodyParams = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      params = { ...params, ...bodyParams };
    }

    // Clean up user ID (remove curly braces if present)
    if (params.loggedInUserId && typeof params.loggedInUserId === 'string') {
      params.loggedInUserId = params.loggedInUserId.replace(/[{}]/g, '').trim();
      console.log('Cleaned user ID:', params.loggedInUserId);
    }

    // Get credentials from environment variables
    params.apiKey = process.env.TADABASE_API_KEY;
    params.appId = process.env.TADABASE_APP_ID;
    params.appSecret = process.env.TADABASE_APP_SECRET;
    params.bidRequestTableId = process.env.BID_REQUEST_TABLE_ID;
    params.usersTableId = process.env.USERS_TABLE_ID;
    params.injuryCategoriesTableId = process.env.INJURY_CATEGORIES_TABLE_ID;
    params.bidRequestDetailsTableId = process.env.BID_REQUEST_DETAILS_TABLE_ID;
    params.claimsTableId = process.env.CLAIMS_TABLE_ID;
    params.plaintiffsTableId = process.env.PLAINTIFFS_TABLE_ID;
    params.openStatusId = process.env.OPEN_STATUS_ID || 'eykNOvrDY3';
    
    const result = await filterBidRequests(params);
    
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: error.statusCode || 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        status: 'failed',
        message: error.message || 'Action failed',
        error: error.toString(),
      })
    };
  }
};
