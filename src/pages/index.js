import { Web5 } from "@web5/api";
import { useState, useEffect } from "react";
import styles from '../styles/Home.module.css'

export default function Home() {
  const [web5, setWeb5] = useState(null);
  const [myDid, setMyDid] = useState(null);
  const [recipientDid, setRecipientDid] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageType, setMessageType] = useState('Secret');
  const [submitStatus, setSubmitStatus] = useState('');
  const [didCopied, setDidCopied] = useState(false);


  useEffect(() => {
    const initWeb5 = async () => {
      console.log(`this log is in initWeb5`);
      if (web5 && did) {
        await configureProtocol(web5, did);
      }
    };
    initWeb5();
  }, []);


  const queryLocalProtocol = async (web5) => {
    console.log('this is in query local protocol')
  };


  const queryRemoteProtocol = async (web5, did) => {
    console.log('this is where Query remote protocol is')
  };

  const installLocalProtocol = async (web5, protocolDefinition) => {
  console.log('this is where we install local protocol')
  };

  const installRemoteProtocol = async (web5, did, protocolDefinition) => {
  console.log('this is where we install remote protocol')
  };

  const defineNewProtocol = () => {
    console.log('this is where we define our protocol')
  };


  const configureProtocol = async (web5, did) => {
   console.log('this is where we configure our protocol')
  };


  const writeToDwnSecretMessage = async (messageObj) => {
   console.log('this is where we Write the secret message')
  };
  const writeToDwnDirectMessage = async (messageObj) => {
    console.log('this is where we Write the direct message')
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Submitting message...');
    setSubmitStatus('Submitting...');

    try {
      const targetDid = messageType === 'Direct' ? recipientDid : myDid;
      let messageObj;
      let record;

      if (messageType === 'Direct') {
        console.log('Sending direct message...');
        messageObj = constructDirectMessage(recipientDid); 
        record = await writeToDwnDirectMessage(messageObj); 
      } else {
        messageObj = constructSecretMessage(); 
        record = await writeToDwnSecretMessage(messageObj);
      }

      if (record) {
        const { status } = await record.send(targetDid);
        console.log("Send record status in handleSubmit", status);
        setSubmitStatus('Message submitted successfully');
        await fetchMessages();
      } else {
        throw new Error('Failed to create record');
      }

      setMessage('');
      setImageUrl('');
    } catch (error) {
      console.error('Error in handleSubmit', error);
      setSubmitStatus('Error submitting message: ' + error.message);
    }
  };

  const constructDirectMessage = (recipientDid) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    return {
      text: message, 
      timestamp: `${currentDate} ${currentTime}`,
      sender: myDid, 
      type: 'Direct', 
      recipientDid: recipientDid,
      imageUrl: imageUrl, 
    };
  };

  const constructSecretMessage = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    return {
      text: message, 
      timestamp: `${currentDate} ${currentTime}`,
      sender: myDid, 
      type: 'Secret',
      imageUrl: imageUrl, 
    };
  };

  const fetchUserMessages = async () => {
    console.log('Fetching sent messages...');
    try {
      const response = await web5.dwn.records.query({
        from: myDid,
        message: {
          filter: {
            protocol: "https://blackgirlbytes.dev/burn-book-finale",
            schema: "https://example.com/directMessageSchema",
          },
        },
      });

      if (response.status.code === 200) {
        const userMessages = await Promise.all(
          response.records.map(async (record) => {
            const data = await record.data.json();
            return {
              ...data, 
              recordId: record.id 
            };
          })
        );
        return userMessages
      } else {
        console.error('Error fetching sent messages:', response.status);
        return [];
      }

    } catch (error) {
      console.error('Error in fetchSentMessages:', error);
    }
  };

  const fetchDirectMessages = async () => {
    console.log('Fetching received direct messages...');
    try {
      const response = await web5.dwn.records.query({
        message: {
          filter: {
            protocol: "https://blackgirlbytes.dev/burn-book-finale",
          },
        },
      });

      if (response.status.code === 200) {
        const directMessages = await Promise.all(
          response.records.map(async (record) => {
            const data = await record.data.json();
            return {
              ...data, 
              recordId: record.id 
            };
          })
        );
        return directMessages
      } else {
        console.error('Error fetching sent messages:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error in fetchReceivedDirectMessages:', error);
    }
  };

  const fetchMessages = async () => {
    const userMessages = await fetchUserMessages();
    const directMessages = await fetchDirectMessages();
    const allMessages = [...(userMessages || []), ...(directMessages || [])];
    setMessages(allMessages);
  };


  const handleCopyDid = async () => {
    if (myDid) {
      try {
        await navigator.clipboard.writeText(myDid);
        setDidCopied(true);
        setTimeout(() => {
          setDidCopied(false);
        }, 3000);
      } catch (err) {
        console.error("Failed to copy DID: " + err);
      }
    }
  };

  const deleteMessage = async (recordId) => {
    try {
      const response = await web5.dwn.records.query({
        message: {
          filter: {
            recordId: recordId,
          },
        },
      });

      if (response.records && response.records.length > 0) {
        const record = response.records[0];
        const deleteResult = await record.delete();

        if (deleteResult.status.code === 202) {
          console.log('Message deleted successfully');
          setMessages(prevMessages => prevMessages.filter(message => message.recordId !== recordId));
        } else {
          console.error('Error deleting message:', deleteResult.status);
        }
      } else {
        console.error('No record found with the specified ID');
      }
    } catch (error) {
      console.error('Error in deleteMessage:', error);
    }
  };


  return (
    <div>
      <div className={styles.header}>
        <div className={styles.avatar}>DB</div>
        <h1 className={styles.title}>Digital Burn Book</h1>
      </div>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your secret message here"
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Enter image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <select
            className={styles.select}
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
          >
            <option value="Secret">Secret</option>
            <option value="Direct">Direct</option>
          </select>
          {messageType === 'Direct' && (
            <input
              className={styles.input}
              type="text"
              value={recipientDid}
              onChange={e => setRecipientDid(e.target.value)}
              placeholder="Enter recipient's DID"
            />
          )}
          <div className={styles.buttonContainer}>
            <button className={styles.button} type="submit">Submit Message</button>
            <button className={styles.secondaryButton} type="button" onClick={fetchMessages}>Refresh Messages</button>
            <button className={styles.secondaryButton} type="button" onClick={handleCopyDid}>Copy DID</button>
          </div>
        </form>
        {didCopied && <p className={styles.alertText}>DID copied to clipboard!</p>}
      </div>
      {messages.map((message, index) => (
        <div key={index} className={styles.container}>
          <div className={styles.field}>
            <div className={styles.fieldName}>From:</div>
            <div className={styles.didContainer}>{message.sender}</div>
          </div>
          <div className={styles.field}>
            <div className={styles.fieldName}>Timestamp</div>
            <div>{message.timestamp}</div>
          </div>
          <div className={styles.messageRow}>
            <div className={styles.messageContent}>
              <div className={styles.fieldName}>Message</div>
              <div>{message.text}</div>
            </div>
            {message.sender === myDid && (
              <button
                className={styles.deleteButton}
                onClick={() => deleteMessage(message.recordId)}
              >
                Delete
              </button>
            )}
          </div>
          {message.imageUrl && (
            <div className={styles.imageContainer}>
              <img
                className={styles.image}
                src={message.imageUrl}
                alt="Uploaded content"
              />
            </div>
          )}
          <div className={`${styles.messageType} ${styles[message.type.toLowerCase()]}`}>
            {message.type}
          </div>
        </div>
      ))}

    </div>
  );
}