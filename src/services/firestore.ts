import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const getUserTasksRef = () => {
  const user = auth().currentUser;
  if (!user || !user.uid) {
    throw new Error('User not authenticated. Please login again.');
  }
  const userId = user.uid;
  console.log('Getting tasks for user:', userId);
  return firestore().collection('users').doc(userId).collection('tasks');
};

export const addTask = async (task: any) => {
  const user = auth().currentUser;
  if (!user || !user.uid) {
    throw new Error('User not authenticated. Please login again.');
  }
  const userId = user.uid;
  console.log('Adding task for user:', userId, 'Task:', task);
  
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('tasks')
    .add({
      ...task,
      completed: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      userId: userId, // Explicitly store user ID in task
    });
};

export const getTasksRealtime = (callback: any) => {
  const user = auth().currentUser;
  if (!user || !user.uid) {
    console.error('User not authenticated');
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }
  
  const userId = user.uid;
  console.log('Setting up realtime listener for user:', userId);
  
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('tasks')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      querySnapshot => {
        const tasks: any[] = [];
        querySnapshot.forEach(doc => {
          const taskData = doc.data();
          tasks.push({ 
            id: doc.id, 
            ...taskData,
            userId: userId // Ensure userId is in task data
          });
        });
        console.log('Tasks retrieved:', tasks.length, 'for user:', userId);
        callback(tasks);
      },
      error => {
        console.error('Error fetching tasks:', error);
        callback([]);
      }
    );
};

export const deleteTask = async (taskId: string) => {
  const user = auth().currentUser;
  if (!user || !user.uid) {
    throw new Error('User not authenticated. Please login again.');
  }
  return getUserTasksRef().doc(taskId).delete();
};

export const toggleComplete = async (taskId: string, completed: boolean) => {
  const user = auth().currentUser;
  if (!user || !user.uid) {
    throw new Error('User not authenticated. Please login again.');
  }
  return getUserTasksRef().doc(taskId).update({ completed });
};

