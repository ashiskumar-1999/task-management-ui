import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { firebaseConfig } from '../config/firebase';
import TaskCard from '@/components/TaskCard';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Task from '@/components/Task';
import { Input } from '@/components/ui/input';
import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';
import Createtask from '@/section/Createtask';
import ProfileSection from '@/section/ProfileSection';
import { FormProps } from '@/types/FormProps';
import { push, set, get, ref, remove, getDatabase } from '@firebase/database';

export interface Item {
  id: number;
  text: string;
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<any>([]);
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formDataTobeAdded, setFormDataTobeAdded] = useState<FormProps>();
  const db = getDatabase(firebaseConfig);
  const pathRef = ref(db, 'Tasks/');
  const statusCategories = [
    { title: 'To-Do', color: '#FAC3FF', key: 'to-do' },
    { title: 'In-Progress', color: '#85D9F1', key: 'in-progress' },
    { title: 'Completed', color: '#C3FFAC', key: 'completed' },
  ];

  // This functionality need some refactoring to behave properly.
  /* const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setTasks((prevTasks: any[]) => {
      // Create a copy of the previous array to avoid mutating the state directly
      const updatedCards = [...prevTasks];

      // Remove the item at dragIndex
      const [movedCard] = updatedCards.splice(dragIndex, 1);

      // Insert the removed item at hoverIndex
      updatedCards.splice(hoverIndex, 0, movedCard);

      return updatedCards;
    });
  }, []); */

  // Now The FormValues coming from the child component CreatTask to Parent component DashBoard. Only add data function to firebase needs to be created.
  const handleSubmit = async (formData: FormProps) => {
    console.log(formData);
    setFormDataTobeAdded(formData);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const PhotoURL = localStorage.getItem('Photo');
      setUrl(PhotoURL);
      const ProfileName = localStorage.getItem('ProfileName');
      setName(ProfileName);
    }
  }, []);
  useEffect(() => {
    if (!formDataTobeAdded) return;
    else {
      const SaveDataToFireBase = async () => {
        try {
          await set(push(pathRef), {
            title: formDataTobeAdded?.title,
            description: formDataTobeAdded?.description,
            dueDate: formDataTobeAdded?.dueDate,
            status: formDataTobeAdded?.status,
            fileURL: formDataTobeAdded?.uploadFile,
          });
        } catch (error) {
          console.error(error);
        }
      };
      SaveDataToFireBase();
    }
  }, [formDataTobeAdded]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        await get(pathRef).then((snapshot) => {
          if (snapshot.exists() && snapshot.val()) {
            const Tasks = Object.entries(snapshot.val()).map(
              ([key, value]: [string, any]) => ({
                id: key,
                ...value,
              })
            );
            setTasks(Tasks);
          }
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchTasks();
  }, [tasks]);

  const handleTaskRemove = useCallback((TaskId: any) => {
    const newPathRef = ref(db, 'Tasks/' + TaskId);
    console.log('NewRef', newPathRef);
    remove(newPathRef)
      .then(() => {
        console.log('Task removed successfully');
        // Update the tasks state to reflect the removal
        setTasks((prevTasks: []) =>
          prevTasks.filter((task: any) => task.id !== TaskId)
        );
      })
      .catch((error) => {
        console.error('Error removing task: ', error);
      });
  }, []);

  const filterTasksByStatus = (statusKey: string) => {
    return tasks && tasks.filter((task: any) => task.status === statusKey);
  };
  const replaceCapitalLetter = (string: string) => {
    return string.replace(/\b\w|-(\w)/g, (str) => str.toUpperCase());
  };

  return (
    <Tabs defaultValue="list">
      <div className="px-9 py-14">
        <div className="flex flex-row justify-between items-start -mb-8">
          <Logo />
          <ProfileSection url={url} name={name} />
        </div>
        <TabsList className="pl-0 space-x-2 border-none bg-transparent">
          <TabsTrigger
            value="list" /* 
            className="border-b border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
           */
          >
            <span className="text-xl font-medium">List</span>
          </TabsTrigger>
          <TabsTrigger value="board">
            <span className="text-xl font-medium">Board</span>
          </TabsTrigger>
        </TabsList>
        <div className="flex flex-row items-center justify-between pt-4">
          <div>
            <span>Filter By:</span>
          </div>
          <div className="flex flex-row items-center gap-4">
            <Input
              placeholder="Search"
              className="p-1.5 font-urbanist text-xs font-semibold rounded-full"
            />
            <Button
              className="px-10 py-6 rounded-full bg-[#7B1984] hover:bg-[#7B1984] font-urbanist text-sm font-bold "
              onClick={() => setIsOpen(true)}
            >
              Add Task
            </Button>
            <Createtask
              onSubmit={handleSubmit}
              isDialogOpen={isOpen}
              onDialogClose={() => setIsOpen(false)}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {statusCategories.map(({ title, color, key }) => {
            const filteredTasks = filterTasksByStatus(key); // Use function inside the loop
            return (
              <TaskCard key={key} headerColor={color} CardTitle={title}>
                {filteredTasks.map((task: any) => (
                  <Task
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    dueDate={task.dueDate}
                    status={replaceCapitalLetter(task.status)}
                    handleDelete={handleTaskRemove}
                  />
                ))}
              </TaskCard>
            );
          })}
        </div>
      </div>
    </Tabs>
  );
};

export default Dashboard;
